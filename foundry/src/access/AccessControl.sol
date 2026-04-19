// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AccessControl - Lapisan Kontrol Akses Berbasis Peran (RBAC) untuk Protokol Bang Bang
/// @notice Mendefinisikan modifier dan peran yang mengatur hak akses semua fungsi protokol.
/// @dev RBAC manual tanpa dependensi OpenZeppelin untuk efisiensi gas maksimal.
///
///      ROLE MAPPING berdasarkan kategori aset:
///        Property → BPN     (Badan Pertanahan Nasional)
///        Vehicle  → Samsat  (Sistem Administrasi Manunggal Satu Atap)
///        Gold     → Pegadaian
///        Other    → Kemenkeu (Kementerian Keuangan)
///
///      Setiap Validator didaftarkan dengan institution tag.
///      Smart contract tidak membatasi verifikasi per institusi (off-chain logic di frontend).

import "./models/AssetSchema.sol";

contract AccessControl {

    // =========================================================
    // STATE VARIABLES — Gas-Optimized Layout
    // =========================================================

    /// @notice Alamat SuperAdmin (Deployer), entitas tertinggi dalam protokol.
    address public owner;

    /// @notice Mapping whitelist: Alamat Validator → status aktif.
    /// @dev O(1) lookup, lebih hemat gas dari array.
    mapping(address => bool) public isVerificator;

    /// @notice Mapping institusi Validator: Alamat → nama institusi (BPN/Samsat/Pegadaian/Kemenkeu).
    /// @dev Disimpan on-chain agar frontend manapun bisa query tanpa state off-chain.
    mapping(address => string) public validatorInstitution;

    // =========================================================
    // EVENTS
    // =========================================================

    /// @notice Dipancarkan saat SuperAdmin menunjuk Validator baru beserta institusinya.
    event VerificatorAppointed(address indexed account, string institution, uint256 timestamp);

    /// @notice Dipancarkan saat SuperAdmin mencabut wewenang Validator.
    event VerificatorRemoved(address indexed account, uint256 timestamp);

    /// @notice Dipancarkan saat kepemilikan kontrak dipindahkan.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    /// @notice Menetapkan deployer sebagai SuperAdmin pertama saat kontrak di-deploy.
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // =========================================================
    // MODIFIERS
    // =========================================================

    /// @notice Membatasi akses hanya untuk SuperAdmin (Owner Kontrak).
    modifier onlyOwner() {
        require(msg.sender == owner, "BangBang: Akses ditolak. Hanya SuperAdmin.");
        _;
    }

    /// @notice Membatasi akses hanya untuk Validator yang telah terdaftar dalam whitelist.
    modifier onlyVerificator() {
        require(isVerificator[msg.sender], "BangBang: Akses ditolak. Bukan Validator resmi.");
        _;
    }

    /// @notice Memberikan akses kepada SuperAdmin DAN Validator.
    modifier onlyAdminOrVerificator() {
        require(
            msg.sender == owner || isVerificator[msg.sender],
            "BangBang: Akses ditolak. Hanya SuperAdmin atau Validator."
        );
        _;
    }

    // =========================================================
    // RBAC ADMIN FUNCTIONS
    // =========================================================

    /// @notice Menunjuk alamat wallet baru sebagai Validator resmi beserta institusinya.
    /// @dev Hanya SuperAdmin. Mencegah penunjukan ulang. institution sebagai calldata hemat gas.
    /// @param _account Alamat wallet calon Validator.
    /// @param _institution Nama institusi: "BPN" | "Samsat" | "Pegadaian" | "Kemenkeu"
    function appointVerificator(address _account, string calldata _institution) external onlyOwner {
        require(_account != address(0), "BangBang: Alamat tidak valid.");
        require(!isVerificator[_account], "BangBang: Alamat sudah terdaftar sebagai Validator.");
        require(bytes(_institution).length > 0, "BangBang: Institusi tidak boleh kosong.");

        isVerificator[_account] = true;
        validatorInstitution[_account] = _institution;

        emit VerificatorAppointed(_account, _institution, block.timestamp);
    }

    /// @notice Mencabut wewenang Validator dari whitelist.
    /// @dev Hanya SuperAdmin. Institution data tetap tersimpan untuk audit history.
    /// @param _account Alamat Validator yang akan dicabut wewenangnya.
    function removeVerificator(address _account) external onlyOwner {
        require(isVerificator[_account], "BangBang: Alamat bukan Validator terdaftar.");
        isVerificator[_account] = false;
        emit VerificatorRemoved(_account, block.timestamp);
    }

    /// @notice Memindahkan kepemilikan SuperAdmin ke alamat baru.
    /// @dev Operasi irreversible jika dikirim ke address salah. Hanya SuperAdmin.
    /// @param _newOwner Alamat pemilik baru.
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "BangBang: Alamat owner baru tidak valid.");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    // =========================================================
    // READ FUNCTIONS
    // =========================================================

    /// @notice Mendapatkan institusi validator berdasarkan alamat.
    /// @param _account Alamat validator.
    /// @return Nama institusi (string).
    function getValidatorInstitution(address _account) external view returns (string memory) {
        return validatorInstitution[_account];
    }
}
