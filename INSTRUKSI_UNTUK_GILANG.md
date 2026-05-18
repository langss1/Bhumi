# 📋 Panduan Setup Otomatis untuk Arin & Ihab

Supaya Arin dan Ihab bisa setup otomatis tanpa bingung, ikuti langkah ini:

### 1. Persiapan di Laptop Gilang (Node 1)
Jalankan script setup utama Anda jika belum:
```powershell
.\besu-network\0_SETUP_LAPTOP1.ps1
```
Ini akan menghasilkan folder `C:\bhumi-besu\node2` dan `C:\bhumi-besu\node3`.

### 2. Apa yang harus DIKIRIM ke Arin & Ihab?
Kirimkan folder project **Bhumi** secara utuh, namun pastikan:
1.  **Arin**: Harus memiliki folder `C:\bhumi-besu\node2` di laptopnya.
2.  **Ihab**: Harus memiliki folder `C:\bhumi-besu\node3` di laptopnya.
3.  Semua orang harus punya file `genesis.json` yang sama (ada di dalam folder `besu-network`).

### 3. Daftar Akun MetaMask untuk Testing
Berikut adalah daftar akun yang sudah diberikan akses (Role) di dalam Smart Contract:

| Role | MetaMask Account Index | Address (Hardhat) |
| :--- | :--- | :--- |
| **Admin BPN** | Account #0 | `0xf39Fd6e51aad...` |
| **BPN Wilayah** | Account #1 & #2 | `0x7099...`, `0x3C44...` |
| **Notaris** | **Account #2 & #3** | `0x3C44...`, `0x90F7...` |
| **Auditor** | Account #4 | `0x15d3...` |
| **Buyer/Seller** | Account #5 dst | `0xdF3e...` |

### 4. Apa yang harus DISET oleh Arin & Ihab? (Otomatis)
Beri tahu mereka cukup melakukan 2 langkah ini saja:
1.  Buka terminal (PowerShell) di folder `besu-network`.
2.  Jalankan script setup otomatis yang baru saya buat:
    ```powershell
    .\SETUP_CLIENT_AUTOMATIC.ps1
    ```
    *Script ini akan otomatis menginstall Besu, mendeteksi IP ZeroTier mereka, dan install library npm.*

### 4. Cara Menjalankan Sehari-hari
Setelah setup sekali di atas selesai, kalian bertiga (Gilang, Arin, Ihab) cukup menjalankan:
```powershell
.\START_NODE_FULL_DECENTRALIZED.ps1
```
Pilih nomor laptop masing-masing, dan **Blockchain + Auto-Storage Sync** akan langsung berjalan.

---
**Catatan Penting**: 
Pastikan kalian bertiga sudah saling `ping` di ZeroTier sebelum memulai agar node bisa saling menemukan.
