# 🌐 Panduan Join Jaringan Bhumi (Untuk Arin & Ihab)

Halo Tim! Folder ini berisi sistem blockchain **Bhumi** yang sudah dikonfigurasi untuk berjalan secara desentralisasi (Peer-to-Peer). Ikuti langkah-langkah di bawah ini untuk menghubungkan laptop kalian ke jaringan.

---

### 1. Persiapan Awal
Pastikan laptop kalian memenuhi kriteria ini:
*   Sudah terhubung ke **ZeroTier** yang sama dengan Gilang.
*   Bisa melakukan `ping` ke IP Gilang (`10.223.153.80`).
*   Menggunakan sistem operasi **Windows**.

---

### 2. Langkah Setup (Hanya Sekali)
Buka terminal **PowerShell** (sebagai Administrator lebih baik), masuk ke folder project ini, lalu jalankan:

```powershell
cd besu-network
.\SETUP_CLIENT_AUTOMATIC.ps1
```

**Apa yang dilakukan script ini?**
*   Otomatis mendownload & install **Hyperledger Besu** (Software Blockchain).
*   Otomatis mendeteksi IP ZeroTier laptop kalian.
*   Menginstall library Node.js yang dibutuhkan untuk sinkronisasi file.
*   Menyiapkan folder identitas node kalian di `C:\bhumi-besu`.

---

### 3. Cara Menjalankan Node & Storage
Setiap kali ingin memulai demo/pengerjaan, cukup jalankan satu perintah ini di PowerShell:

```powershell
.\START_NODE_FULL_DECENTRALIZED.ps1
```

*   **Pilih Laptop**: Masukkan nomor sesuai identitas kalian (**2** untuk Arin, **3** untuk Ihab).
*   **Biarkan Terbuka**: Terminal ini akan menjalankan Blockchain dan *Sync Agent* (untuk download file PDF otomatis) secara bersamaan. Jangan ditutup selama demo.

---

### 4. Menghubungkan MetaMask
Agar bisa bertransaksi di website, setting MetaMask kalian ke jaringan baru:
*   **Network Name**: Bhumi Network
*   **RPC URL**: `http://localhost:8545` (atau IP Gilang `http://10.223.153.80:8545`)
*   **Chain ID**: `31337`
*   **Currency Symbol**: ETH

---

### 5. Daftar Akun Testing (MetaMask)
Gunakan akun-akun dari Hardhat (impor private key) untuk mencoba berbagai role:

| Role | Akun MetaMask | Keterangan |
| :--- | :--- | :--- |
| **BPN Wilayah** | Account #1 atau #2 | Untuk mendaftarkan tanah baru |
| **Notaris** | **Account #2 atau #3** | Untuk tanda tangan AJB (Balik Nama) |
| **Investor/User** | Account #5 ke atas | Untuk beli/jual tanah |

---

### 🛠️ Troubleshooting
*   **Node tidak sinkron?** Pastikan ZeroTier aktif dan firewall Windows mengizinkan port `30303` dan `8545`.
*   **Error Java?** Script setup sudah mencoba menginstall Java, jika gagal, pastikan Java 17+ sudah terinstall secara manual.

**Selamat Ber-Blockchain!** 🚀
