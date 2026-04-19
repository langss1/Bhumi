// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AssetSchema - Model Data Aset untuk Protokol Bang Bang
/// @notice Mendefinisikan tipe data utama: Enum, Struct, dan Mapping yang digunakan di seluruh protokol.
/// @dev File ini adalah lapisan "Model" dalam arsitektur MVC. Tidak berisi logika bisnis.
///      Dioptimalkan untuk storage packing: tipe kecil dikelompokkan bersama untuk hemat gas.

/// @notice Kategori jenis aset fisik yang didukung oleh protokol.
/// @dev Role-based validator mapping:
///      Property → BPN (Badan Pertanahan Nasional)
///      Vehicle  → Samsat
///      Gold     → Pegadaian
///      Other    → Kemenkeu (Kementerian Keuangan)
enum AssetCategory {
    Property,   // Properti & Tanah (SHM, HGB) → Validator: BPN
    Vehicle,    // Kendaraan Bermotor (BPKB)    → Validator: Samsat
    Gold,       // Logam Mulia (Antam, LM)      → Validator: Pegadaian
    Other       // Properti lain, dll            → Validator: Kemenkeu
}

/// @notice Institusi validator berdasarkan kategori aset.
/// @dev Digunakan sebagai identifier role di frontend untuk filtering validator sesuai wewenang.
enum ValidatorInstitution {
    BPN,        // Badan Pertanahan Nasional (untuk Property/Tanah)
    Samsat,     // Sistem Administrasi Manunggal Satu Atap (untuk Kendaraan)
    Pegadaian,  // PT Pegadaian (untuk Emas/Logam Mulia)
    Kemenkeu    // Kementerian Keuangan (untuk aset lainnya)
}

/// @notice Status lifecycle aset dalam sistem.
enum AssetState {
    Pending,    // Baru didaftarkan, menunggu verifikasi
    Verified,   // Telah diverifikasi oleh Validator yang sah
    Archived    // Aset dinonaktifkan (immutable blockchain)
}

/// @notice Struktur data utama yang merepresentasikan satu unit aset fisik on-chain.
/// @dev Gas-optimized storage packing:
///      - bool (1 byte) digabung dengan enum (1 byte) di slot yang sama
///      - address (20 bytes) diletakkan terpisah karena tidak bisa dipacking dengan uint256
///      - String disimpan terakhir karena dynamic type (tidak mempengaruhi packing slot fixed)
struct Asset {
    // === Slot 1: assetId (32 bytes — 1 slot penuh) ===
    uint256 assetId;

    // === Slot 2: owner (20 bytes) + 12 bytes sisa → tidak cukup untuk uint96/address lain ===
    address owner;

    // === Slot 3: verifiedBy (20 bytes) ===
    address verifiedBy;

    // === Slot 4: valuation (32 bytes — 1 slot penuh) ===
    uint256 valuation;

    // === Slot 5: registeredAt (32 bytes — 1 slot penuh) ===
    uint256 registeredAt;

    // === Slot 6: verifiedAt (32 bytes — 1 slot penuh) ===
    uint256 verifiedAt;

    // === Slot 8: pendingValuation (32 bytes — 1 slot penuh) ===
    uint256 pendingValuation;

    // === Slot 7: category (1 byte) + state (1 byte) + valuationUpdatePending (1 byte) = 3 bytes total, packed dalam 1 slot ===
    AssetCategory category;
    AssetState    state;
    bool          valuationUpdatePending;

    // === Dynamic slots: string (stored as dynamic arrays, tidak mempengaruhi packing di atas) ===
    string documentHash;  // SHA-256 hash dokumen legal (BPKB, SHM, dll)
    string assetName;     // Nama deskriptif aset
}

/// @notice Helper function membaca institusi validator yang berwenang berdasarkan kategori aset.
/// @dev Pure function — tidak membaca state, hemat gas sebagai lookup table.
/// @param category Kategori aset yang ingin dicek.
/// @return Nama institusi validator dalam bentuk string.
function getValidatorInstitution(AssetCategory category) pure returns (string memory) {
    if (category == AssetCategory.Property) return "BPN";
    if (category == AssetCategory.Vehicle)  return "Samsat";
    if (category == AssetCategory.Gold)     return "Pegadaian";
    return "Kemenkeu";
}
