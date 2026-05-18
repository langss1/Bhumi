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
Gunakan akun-akun dari Hardhat berikut dengan mengimpor **Private Key**-nya ke MetaMask untuk mencoba berbagai role:

| Role | Akun MetaMask | Address | Private Key (Salin ini) |
| :--- | :--- | :--- | :--- |
| **Admin BPN Pusat** | Account #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **BPN Wilayah A (Arin)** | Account #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **BPN Wilayah B / Notaris 1 (Ihab)** | Account #2 | `0x3C44Cd3B6a84143f5C29014932565f6ec31725c1` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Notaris 2** | Account #3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Auditor** | Account #4 | `0x15d34AAf54a6b74434261d2b1f8ef47c13C2d385` | `0x47e17173e576c80339c82a1282209d6f357521115e98139c2ad67406a38096f2` |
| **Investor / Buyer / Seller** | Account #5 | `0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097` | `0x8b353bb44e8194e85db42c194e5113ae22f46ccde47e4f16b2e3e1c8d7b3dc60` |

---

### 🛠️ Troubleshooting
*   **Node tidak sinkron?** Pastikan ZeroTier aktif dan firewall Windows mengizinkan port `30303` dan `8545`.
*   **Error Java?** Script setup sudah mencoba menginstall Java, jika gagal, pastikan Java 17+ sudah terinstall secara manual.

**Selamat Ber-Blockchain!** 🚀
