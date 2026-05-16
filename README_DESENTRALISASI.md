# 🛠️ Update Fitur: Jaringan & Storage Desentralisasi (Bhumi v2)

Update ini memperbaiki ketergantungan pada Laptop 1 dan menambahkan fitur sinkronisasi file lokal otomatis.

### 1. Jaringan Mandiri (No Single Point of Failure)
*   **Masalah Lama**: Jika Laptop 1 (Gilang) mati, jaringan hancur karena dia adalah satu-satunya Bootnode.
*   **Solusi Baru**: Semua laptop (Gilang, Arin, Ihab) sekarang adalah **Full Node**. Siapa pun bisa menyala duluan, dan siapa pun bisa jadi "pintu masuk" bagi node lain.
*   **Cara Pakai**: Jalankan `besu-network/START_NODE_FULL_DECENTRALIZED.ps1`.

### 2. Sinkronisasi Storage Lokal (Auto-CRUD)
*   **Fitur Baru**: Setiap laptop sekarang menyimpan **copy fisik file (PDF)** di folder lokal `C:\bhumi-data\storage`.
*   **Cara Kerja**:
    1.  Saat ada yang cetak sertifikat atau upload AJB di web, data masuk ke Blockchain.
    2.  Script `bhumi-storage-sync.js` yang jalan di background akan mendeteksi transaksi tersebut.
    3.  File PDF akan otomatis didownload ke folder komputer kalian masing-masing.
    4.  **Hasilnya**: Meskipun 2 laptop mati, saat nyala kembali, mereka akan otomatis "mengejar" data file yang tertinggal.

### 3. Konfigurasi Jaringan (PENTING!)
Jika IP ZeroTier teman kalian berubah, cukup edit file:
`besu-network/network_config.ps1`
Ganti IP di sana, dan simpan. Tidak perlu merubah Smart Contract atau file lain.

---
**Tim Bhumi - 2026**
