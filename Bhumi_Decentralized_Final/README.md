# Bhumi - Sistem Sertifikasi Tanah Digital (BPN)

Bhumi adalah aplikasi terdesentralisasi (DApp) berbasis Web3 yang dibangun untuk mensimulasikan sistem sertifikasi lahan digital Kementerian Agraria dan Tata Ruang / Badan Pertanahan Nasional (BPN). 

Aplikasi ini mendemonstrasikan sistem berbasis *Role-Based Access Control (RBAC)* dengan pembagian akses ke 5 "Laptop/Node":
1. **Laptop 1 (BPN Pusat - Gilang)**: Admin Utama (Panic Button & Grant Role).
2. **Laptop 2 & 3 (BPN Wilayah - Kristo & Ihab)**: Validator & Minter NFT Tanah.
3. **Laptop 4 (Notaris/PPAT - Farhan)**: Approval Akhir Transaksi & Upload AJB.
4. **Laptop 5 (Auditor/KPK - Arina)**: Dasbor Read-Only untuk pemantauan.

---

## 🚀 PANDUAN SETUP (UNTUK SELURUH ANGGOTA KELOMPOK)

Ikuti panduan ini **secara berurutan**. Kegagalan 1 langkah akan membuat aplikasi tidak jalan!

### 1. Menyamakan Jaringan (Wajib)
Aplikasi Blockchain tidak akan bisa "ngobrol" kalau komputer kalian tidak dalam satu jaringan.
* Unduh dan instal **ZeroTier** atau **Radmin VPN** di kelima laptop.
* Masuk ke *Network* yang sama.
* Tentukan siapa yang jadi "Tuan Rumah" (Host/Bootnode). Misalnya **Gilang**.
* Catat IP ZeroTier Gilang (Misal: `192.168.1.5`).

### 2. Konfigurasi Wallet (MetaMask)
Semua anggota **WAJIB** menambahkan jaringan lokal ke dalam MetaMask kalian:
1. Buka MetaMask -> *Add Network* -> *Add a network manually*.
2. **Network Name**: BPN Local Network
3. **New RPC URL**: `http://192.168.1.5:8545` *(Ganti IP ini dengan IP ZeroTier Gilang)*.
4. **Chain ID**: `1337`
5. **Currency Symbol**: `ETH`

### 3. Mengunduh dan Menyiapkan Proyek (Di Semua Laptop)
Semua anggota melakukan *clone* repositori ini di laptop masing-masing:
```bash
git clone https://github.com/langss1/Bhumi.git
cd Bhumi
```

Masuk ke folder Frontend dan pasang semua dependensinya:
```bash
cd frontend
npm install
```

### 4. Setup File Rahasia (PENTING!)
File `.env.local` tidak diunggah ke GitHub karena alasan keamanan. Kalian **WAJIB** membuatnya sendiri.
1. Copy file contoh yang sudah disediakan:
   ```bash
   cp .env.example .env.local
   ```
2. Buka file `.env.local` tersebut.
3. Masukkan `NEXT_PUBLIC_PINATA_JWT` yang sudah dibuat oleh Gilang sebelumnya.
4. Masukkan `NEXT_PUBLIC_CONTRACT_ADDRESS` dari hasil *Deploy* Gilang (lihat langkah 5 di bawah).

### 5. Khusus Gilang (Host & Deployer)
Gilang bertugas menjalankan Blockchain (IBFT 2.0 / Hardhat) dan menanamkan Smart Contract ke dalamnya.
1. Buka terminal baru.
2. Masuk ke folder Smart Contract:
   ```bash
   cd hardhat_deploy
   npm install
   ```
3. Nyalakan jaringan lokal / *deploy* kontrak:
   ```bash
   npx hardhat run scripts/deploy.js --network bpn_local
   ```
4. Terminal akan memunculkan tulisan `LandRegistry Contract Deployed to: 0xABCD...`.
5. **Kirim alamat `0xABCD...` tersebut ke grup WhatsApp kalian!** Semua anggota harus menempelkan alamat tersebut ke dalam file `.env.local` milik mereka masing-masing.

### 6. Jalankan Aplikasi
Setelah `.env.local` terisi Contract Address yang baru dan JWT Pinata, jalankan aplikasi:
```bash
npm run dev
```
Buka browser dan akses `http://localhost:3000`. Selesai! 🎉

---

## 🚨 ANALISIS TROUBLESHOOTING (JIKA ERROR)

Jika aplikasi tidak jalan, jangan panik. Berikut adalah analisis 4 masalah pasti yang sering terjadi dan cara mengatasinya:

### 1. Error: "Cannot connect to network / MetaMask Loading Terus"
* **Penyebab**: MetaMask atau Frontend tidak bisa menghubungi RPC Laptop Gilang.
* **Solusi**: 
  1. Pastikan IP di Radmin/ZeroTier Gilang benar-benar aktif (coba `ping 192.168.1.5` dari laptop teman).
  2. Pastikan file `frontend/src/lib/wagmi.ts` di baris ke-15 dan 29 sudah menggunakan IP Gilang yang benar! Jika IP Gilang berubah jadi `192.168.192.10`, file `wagmi.ts` **harus diubah**.
  3. Pastikan Gilang tidak menyalakan Firewall Windows yang memblokir port `8545`.

### 2. Error: "Contract Reverted / Execution Failed" saat klik tombol di web
* **Penyebab**: Smart Contract menolak transaksi.
* **Solusi**: 
  1. Akun Anda mungkin tidak punya **Role** yang tepat. Fungsi Minting hanya bisa diklik oleh *BPN Wilayah*. Minta Gilang (Pusat) untuk menjalankan fitur "Grant Role" ke dompet Metamask Anda!
  2. Tanah sedang dalam status "Sengketa" (Panic Button sedang menyala).
  3. Anda lupa mengisi `.env.local` dengan Contract Address yang benar, sehingga tombol menembak ke ruang kosong.

### 3. Error: "Gagal Mengunggah ke IPFS / JWT Invalid"
* **Penyebab**: File `.env.local` milik anggota tidak memiliki `NEXT_PUBLIC_PINATA_JWT`.
* **Solusi**: Minta token panjang rahasia JWT milik Gilang dan masukkan ke file `.env.local` kalian.

### 4. Transaksi MetaMask "Pending" tidak pernah selesai
* **Penyebab**: Jaringan IBFT 2.0 kalian terhenti (macet) karena node Validator ada yang mati.
* **Solusi**: Dalam IBFT, jika ada 3 Validator, maka minimal 2 Validator harus selalu online. Jika laptop Kristo dan Ihab mati, jaringan Gilang tidak akan bisa memproses transaksi. Solusinya: Pastikan minimal 2 laptop Validator selalu *Online* dan *Syncing*.
