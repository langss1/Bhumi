// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./models/AssetSchema.sol";
import "./access/AccessControl.sol";

/// @title BangBang Protocol - Kontrak Utama Manajemen Aset Fisik Terdesentralisasi
/// @author Tim Bang Bang
/// @notice Protokol RWA: pencatatan, verifikasi, dan pengelolaan portofolio aset fisik on-chain.
///
///         ROLE-BASED VALIDATOR (sesuai kategori aset):
///           Property → BPN     | Vehicle → Samsat
///           Gold     → Pegadaian | Other → Kemenkeu
///
///         GAS OPTIMIZATION:
///           - calldata untuk semua string parameter (bukan memory)
///           - unchecked counter increment
///           - swap-and-pop untuk array removal O(1)
///           - escrow zeroed sebelum transfer (CEI pattern, anti-reentrancy)
///           - event indexed fields untuk filter yang efisien
///
/// @dev Mewarisi AccessControl untuk RBAC. Kompatibel dengan Base Sepolia / Ethereum Sepolia Testnet.
contract BangBang is AccessControl {

    // =========================================================
    // STATE VARIABLES
    // =========================================================

    /// @notice Biaya registrasi aset (escrow sampai verifikasi selesai).
    /// @dev Dapat diubah SuperAdmin via setValidationFee(). Tidak retroaktif.
    uint256 public validationFee;

    /// @notice Counter ID aset — auto-increment dari 1.
    uint256 private _assetCounter;

    /// @notice Counter aset aktif (tidak diarsipkan).
    uint256 private _activeAssetCount;

    /// @notice Mapping utama O(1): ID Aset → Struct Aset.
    mapping(uint256 => Asset) private _assets;

    /// @notice Mapping O(1): Alamat Owner → Daftar ID Aset.
    mapping(address => uint256[]) private _ownerAssets;

    /// @notice Escrow mapping: ID Aset → Jumlah ETH yang ditahan.
    /// @dev Selalu di-zero sebelum transfer untuk mencegah reentrancy.
    mapping(uint256 => uint256) private _escrowBalance;

    // =========================================================
    // EVENTS
    // =========================================================

    /// @notice Asset berhasil didaftarkan. category di-index untuk filter per institusi.
    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        AssetCategory indexed category,
        uint256 valuation,
        uint256 timestamp
    );

    /// @notice Asset berhasil diverifikasi. Distribusi escrow otomatis: 80/20.
    event AssetVerified(
        uint256 indexed assetId,
        address indexed verificator,
        uint256 feeToVerificator,
        uint256 feeToAdmin,
        uint256 timestamp
    );

    /// @notice Valuasi aset diperbarui oleh pemilik.
    event ValuationUpdated(
        uint256 indexed assetId,
        uint256 oldValuation,
        uint256 newValuation,
        uint256 timestamp
    );

    /// @notice Kepemilikan aset dipindahkan.
    event AssetTransferred(
        uint256 indexed assetId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    /// @notice Asset diarsipkan (soft-delete, data tetap on-chain).
    event AssetArchived(uint256 indexed assetId, address indexed actor, uint256 timestamp);

    /// @notice Biaya validasi diubah SuperAdmin.
    event ValidationFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    /// @notice Menginisialisasi protokol dengan biaya validasi awal.
    /// @param _initialFee Biaya validasi awal dalam satuan Wei.
    constructor(uint256 _initialFee) AccessControl() {
        validationFee = _initialFee;
    }

    // =========================================================
    // WRITE FUNCTIONS (CRUD)
    // =========================================================

    /// @notice Mendaftarkan aset fisik baru ke dalam protokol Bang Bang.
    /// @dev Payable — user harus mengirim ETH ≥ validationFee sebagai escrow.
    ///      Menggunakan calldata untuk _name dan _documentHash (hemat gas vs memory).
    ///      Counter increment dengan unchecked (overflow tidak mungkin terjadi dalam praktik).
    /// @param _name         Nama deskriptif aset (e.g., "Villa Dago Pakar").
    /// @param _category     Kategori aset: Property/Vehicle/Gold/Other.
    /// @param _valuation    Nilai taksir aset dalam Wei.
    /// @param _documentHash Hash SHA-256 dari dokumen legal aset (atau IPFS CID).
    /// @return assetId ID unik aset yang baru terdaftar.
    function registerAsset(
        string calldata _name,
        AssetCategory _category,
        uint256 _valuation,
        string calldata _documentHash
    ) external payable returns (uint256 assetId) {
        require(msg.value >= validationFee, "BangBang: Biaya validasi tidak mencukupi.");
        require(bytes(_name).length > 0, "BangBang: Nama aset tidak boleh kosong.");
        require(_valuation > 0, "BangBang: Nilai valuasi harus lebih dari nol.");

        // Gas-efficient counter increment
        unchecked { 
            _assetCounter++; 
            _activeAssetCount++;
        }
        assetId = _assetCounter;

        // Simpan escrow sebelum membuat entitas aset
        _escrowBalance[assetId] = msg.value;

        // Buat entitas Asset baru
        _assets[assetId] = Asset({
            assetId:      assetId,
            owner:        msg.sender,
            verifiedBy:   address(0),
            valuation:    _valuation,
            registeredAt: block.timestamp,
            verifiedAt:   0,
            category:     _category,
            state:        AssetState.Pending,
            documentHash: _documentHash,
            assetName:    _name,
            pendingValuation: 0,
            valuationUpdatePending: false
        });

        // Tambahkan ID ke daftar aset owner
        _ownerAssets[msg.sender].push(assetId);

        emit AssetRegistered(assetId, msg.sender, _category, _valuation, block.timestamp);
    }

    /// @notice Memverifikasi aset dan mendistribusikan escrow fee secara otomatis.
    /// @dev CEI Pattern (Checks-Effects-Interactions) — escrow di-zero SEBELUM transfer.
    ///      Distribusi: 80% ke Validator, 20% ke SuperAdmin.
    ///      Hanya Validator resmi yang terdaftar di whitelist bisa memanggil ini.
    /// @param _assetId ID aset yang akan diverifikasi.
    function verifyAsset(uint256 _assetId) external onlyVerificator {
        Asset storage asset = _assets[_assetId];
        require(asset.assetId != 0, "BangBang: Aset tidak ditemukan.");
        require(asset.state == AssetState.Pending, "BangBang: Aset bukan dalam status Pending.");

        // EFFECTS: Update state sebelum transfer (CEI pattern)
        asset.state      = AssetState.Verified;
        asset.verifiedBy = msg.sender;
        asset.verifiedAt = block.timestamp;

        // EFFECTS: Zero escrow sebelum interaction (anti-reentrancy)
        uint256 totalFee = _escrowBalance[_assetId];
        _escrowBalance[_assetId] = 0;

        // INTERACTIONS: Transfer ETH (unchecked arithmetic untuk fee split yang aman)
        uint256 feeToVerificator;
        uint256 feeToAdmin;
        unchecked {
            feeToVerificator = (totalFee * 80) / 100;
            feeToAdmin       = totalFee - feeToVerificator; // Tepat 20%, menghindari rounding
        }

        (bool sentToVerificator,) = payable(msg.sender).call{value: feeToVerificator}("");
        require(sentToVerificator, "BangBang: Transfer ke Validator gagal.");

        (bool sentToAdmin,) = payable(owner).call{value: feeToAdmin}("");
        require(sentToAdmin, "BangBang: Transfer ke SuperAdmin gagal.");

        emit AssetVerified(_assetId, msg.sender, feeToVerificator, feeToAdmin, block.timestamp);
    }

    /// @notice Menolak aset dan mengembalikan escrow fee penuh ke pemilik.
    /// @dev CEI pattern: escrow di-zero SEBELUM refund.
    /// @param _assetId ID aset yang akan ditolak.
    function rejectAsset(uint256 _assetId) external onlyVerificator {
        Asset storage asset = _assets[_assetId];
        require(asset.assetId != 0, "BangBang: Aset tidak ditemukan.");
        require(asset.state == AssetState.Pending, "BangBang: Aset bukan dalam status Pending.");

        // EFFECTS
        asset.state = AssetState.Archived;
        
        unchecked {
            if (_activeAssetCount > 0) _activeAssetCount--;
        }

        uint256 refundAmount = _escrowBalance[_assetId];
        _escrowBalance[_assetId] = 0; // Zero sebelum transfer

        // INTERACTIONS: Refund ke owner
        if (refundAmount > 0) {
            (bool refunded,) = payable(asset.owner).call{value: refundAmount}("");
            require(refunded, "BangBang: Pengembalian dana ke owner gagal.");
        }

        emit AssetArchived(_assetId, msg.sender, block.timestamp);
    }

    /// @notice Mengajukan pembaruan nilai taksir aset (menunggu persetujuan Validator).
    /// @param _assetId       ID aset yang akan diperbarui.
    /// @param _newValuation  Nilai taksir baru yang diajukan.
    function updateValuation(uint256 _assetId, uint256 _newValuation) external {
        Asset storage asset = _assets[_assetId];
        require(asset.owner == msg.sender, "BangBang: Hanya pemilik aset yang dapat melakukan ini.");
        require(asset.state != AssetState.Archived, "BangBang: Aset telah diarsipkan.");
        require(_newValuation > 0, "BangBang: Nilai valuasi baru harus lebih dari nol.");

        asset.pendingValuation = _newValuation;
        asset.valuationUpdatePending = true;

        emit ValuationUpdated(_assetId, asset.valuation, _newValuation, block.timestamp);
    }

    /// @notice Menyetujui pembaruan nilai taksir aset (Hanya Validator).
    /// @param _assetId ID aset.
    function approveValuationUpdate(uint256 _assetId) external onlyVerificator {
        Asset storage asset = _assets[_assetId];
        require(asset.valuationUpdatePending, "BangBang: Tidak ada permintaan pembaruan valuasi.");

        uint256 oldVal = asset.valuation;
        asset.valuation = asset.pendingValuation;
        asset.pendingValuation = 0;
        asset.valuationUpdatePending = false;

        emit ValuationUpdated(_assetId, oldVal, asset.valuation, block.timestamp);
    }

    /// @notice Menolak pembaruan nilai taksir aset (Hanya Validator).
    /// @param _assetId ID aset.
    function rejectValuationUpdate(uint256 _assetId) external onlyVerificator {
        Asset storage asset = _assets[_assetId];
        require(asset.valuationUpdatePending, "BangBang: Tidak ada permintaan pembaruan valuasi.");

        asset.pendingValuation = 0;
        asset.valuationUpdatePending = false;
    }

    /// @notice Memindahkan kepemilikan aset ke alamat lain (hanya Verified).
    /// @dev Menggunakan swap-and-pop O(1) untuk hapus dari owner lama.
    /// @param _to      Alamat penerima aset.
    /// @param _assetId ID aset yang akan ditransfer.
    function transferAsset(address _to, uint256 _assetId) external {
        Asset storage asset = _assets[_assetId];
        require(asset.owner == msg.sender, "BangBang: Hanya pemilik aset yang dapat melakukan ini.");
        require(_to != address(0), "BangBang: Alamat tujuan tidak valid.");
        require(asset.state == AssetState.Verified, "BangBang: Hanya aset terverifikasi yang dapat ditransfer.");

        address previousOwner = asset.owner;
        asset.owner = _to;

        _ownerAssets[_to].push(_assetId);
        _removeFromOwnerList(previousOwner, _assetId);

        emit AssetTransferred(_assetId, previousOwner, _to, block.timestamp);
    }

    /// @notice Mengarsipkan aset (soft-delete, operasi irreversible).
    /// @dev Bisa dipanggil oleh owner aset ATAU SuperAdmin.
    /// @param _assetId ID aset yang akan diarsipkan.
    function archiveAsset(uint256 _assetId) external {
        Asset storage asset = _assets[_assetId];
        require(
            asset.owner == msg.sender || msg.sender == owner,
            "BangBang: Hanya pemilik atau SuperAdmin yang dapat mengarsipkan."
        );
        require(asset.state != AssetState.Archived, "BangBang: Aset sudah diarsipkan.");

        asset.state = AssetState.Archived;

        unchecked {
            if (_activeAssetCount > 0) _activeAssetCount--;
        }

        emit AssetArchived(_assetId, msg.sender, block.timestamp);
    }

    // =========================================================
    // ADMIN FUNCTIONS
    // =========================================================

    /// @notice Mengubah biaya validasi untuk registrasi aset baru.
    /// @dev Hanya SuperAdmin. Tidak berlaku retroaktif.
    /// @param _newFee Biaya validasi baru dalam Wei.
    function setValidationFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = validationFee;
        validationFee = _newFee;
        emit ValidationFeeUpdated(oldFee, _newFee, block.timestamp);
    }

    /// @notice Fungsi darurat untuk menarik ETH yang tersangkut di kontrak.
    /// @dev Hanya SuperAdmin. Escrow legitimate sudah terdistribusi saat verifyAsset.
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "BangBang: Tidak ada saldo yang perlu ditarik.");
        (bool sent,) = payable(owner).call{value: balance}("");
        require(sent, "BangBang: Penarikan dana darurat gagal.");
    }

    /// @notice Menghapus semua aset milik user tertentu (SuperAdmin only).
    /// @param _user Alamat user yang akan dihapus.
    function removeUserAccount(address _user) external onlyOwner {
        uint256[] memory userAssets = _ownerAssets[_user];
        for (uint256 i = 0; i < userAssets.length; i++) {
            uint256 assetId = userAssets[i];
            if (_assets[assetId].state != AssetState.Archived) {
                _assets[assetId].state = AssetState.Archived;
                unchecked { _activeAssetCount--; }
            }
        }
        delete _ownerAssets[_user];
    }

    // =========================================================
    // READ FUNCTIONS (VIEW — Gas Free)
    // =========================================================

    /// @notice Mengambil seluruh detail struct aset berdasarkan ID-nya. O(1).
    /// @param _assetId ID aset.
    /// @return Struct Asset lengkap.
    function getAssetDetails(uint256 _assetId) external view returns (Asset memory) {
        require(_assets[_assetId].assetId != 0, "BangBang: Aset tidak ditemukan.");
        return _assets[_assetId];
    }

    /// @notice Mengambil daftar semua ID aset milik sebuah alamat.
    /// @param _owner Alamat wallet yang diperiksa.
    /// @return Array ID aset milik alamat tersebut.
    function getAssetsByOwner(address _owner) external view returns (uint256[] memory) {
        return _ownerAssets[_owner];
    }

    /// @notice Mengembalikan jumlah aset aktif (tidak diarsipkan).
    /// @return Total aset aktif.
    function getTotalAssets() external view returns (uint256) {
        return _activeAssetCount;
    }

    /// @notice Memeriksa saldo escrow yang ditahan untuk sebuah aset.
    /// @param _assetId ID aset.
    /// @return Jumlah Wei dalam escrow.
    function getEscrowBalance(uint256 _assetId) external view returns (uint256) {
        return _escrowBalance[_assetId];
    }

    /// @notice Mendapatkan institusi validator yang berwenang untuk kategori aset tertentu.
    /// @dev Pure function — tidak membaca state, gas gratis.
    /// @param _category Kategori aset.
    /// @return Nama institusi yang berwenang.
    function getRequiredInstitution(AssetCategory _category) external pure returns (string memory) {
        return getValidatorInstitution(_category);
    }

    // =========================================================
    // INTERNAL HELPER FUNCTIONS
    // =========================================================

    /// @notice Menghapus ID aset dari daftar owner dengan teknik swap-and-pop.
    /// @dev O(1) average — menghindari array shift O(n) yang boros gas.
    ///      unchecked digunakan pada loop counter karena length dari array tidak mungkin overflow uint256.
    /// @param _owner   Alamat owner yang daftarnya diperbarui.
    /// @param _assetId ID aset yang dihapus.
    function _removeFromOwnerList(address _owner, uint256 _assetId) internal {
        uint256[] storage ownerList = _ownerAssets[_owner];
        uint256 length = ownerList.length;
        for (uint256 i = 0; i < length; ) {
            if (ownerList[i] == _assetId) {
                ownerList[i] = ownerList[length - 1]; // Tukar dengan elemen terakhir
                ownerList.pop();                       // Hapus elemen terakhir
                break;
            }
            unchecked { ++i; } // Hemat gas: skip overflow check
        }
    }

    /// @notice Fallback untuk menerima ETH langsung ke kontrak (misal: escrow dari integrasi lain).
    receive() external payable {}
}
