# 📝 Laporan Pekerjaan & Resolusi Infrastruktur Blockchain Bhumi
**Disusun Oleh:** Gilang (Laptop 1 — BPN Pusat / Bootnode)  
**Tanggal:** 27 Mei 2026  
**Proyek:** Tugas Semester 6 — Platform Blockchain Desentralisasi P2P "Bhumi"

---

## 📌 1. Pendahuluan & Konteks Pekerjaan
Laporan ini merangkum seluruh perbaikan bug, pembersihan repository, migrasi sistem ke arsitektur desentralisasi berbasis **Docker Compose**, serta keberhasilan penuh deployment Smart Contract pada jaringan **Hyperledger Besu (Istanbul Byzantine Fault Tolerance - IBFT 2.0)** secara Peer-to-Peer (P2P).

---

## 🛠️ 2. Daftar Pekerjaan yang Telah Diselesaikan (What You Have Done)

### ✅ A. Resolusi Konflik Git & Sinkronisasi Repositori
* **Masalah:** Konflik internal Git terjadi karena adanya berkas *untracked* lokal (seperti backup folder, konfigurasi Docker, dll) yang bertabrakan dengan file terstruktur baru dari repositori *remote* saat melakukan `git pull`.
* **Solusi:** 
  1. Seluruh berkas *untracked* diamankan sementara ke folder `c:\Tugas Semester 6\Blockchain\untracked_backup\` (di luar repositori aktif).
  2. Eksekusi `git pull origin main` berhasil dilakukan.
  3. Repositori dibersihkan menggunakan `git reset --hard HEAD` untuk menjamin status repositori 100% sinkron (*working tree clean*) dan bebas konflik.

### ✅ B. Pembenahan Bug Kodingan (Bug Fixing)
1. **Perbaikan TS Compile Error (`wagmi.ts`):**
   * **Masalah:** Terdapat penggunaan BigInt literal `0n` pada file [wagmi.ts](file:///c:/Tugas%20Semester%206/Blockchain/tubes/Bhumi_Decentralized_Final/frontend/src/lib/wagmi.ts#L17). Target compiler TypeScript (`tsconfig.json`) diset ke `ES2017` yang belum mendukung literal `0n`, memicu error kompilasi frontend.
   * **Solusi:** Diubah menjadi format standard `BigInt(0)`. Kompilasi frontend Next.js kini berhasil 100% tanpa kendala!
2. **Perbaikan Broken Symlink Path (`bhumi-storage-sync.js`):**
   * **Masalah:** Di OS Windows, folder `frontend` pada root dibaca sebagai file teks biasa (Git Symlink 34 byte), mengakibatkan *error* kegagalan file (`ENOENT`) karena script tidak dapat menemukan folder `.env.local` dan file ABI kontrak.
   * **Solusi:** Jalur pencarian di [bhumi-storage-sync.js](file:///c:/Tugas%20Semester%206/Blockchain/tubes/besu-network/bhumi-storage-sync.js#L12) diperbarui secara absolut menunjuk langsung ke direktori riil: `../Bhumi_Decentralized_Final/frontend`.

### ✅ C. Manajemen Identitas Node & Keamanan Kredensial
* **Solusi:** 
  1. Membuat berkas identitas konfigurasi khusus untuk ketiga node: `.env.laptop1` (Gilang), `.env.laptop2` (Arin), dan `.env.laptop3` (Ihab).
  2. Menerapkan pengamanan data privasi dengan memasukkan seluruh berkas `.env.laptop*`, `.env`, serta folder `node-identities/` ke dalam file `.gitignore` agar kunci rahasia (*private keys*) tidak ter-push ke repositori GitHub publik.
  3. Menyalin kunci identitas rahasia validator Besu (`node1.key`, `node2.key`, `node3.key`) ke folder `docker/node-keys/` serta menghapus awalan `0x` dari isinya agar kompatibel dengan format kunci internal Hyperledger Besu.

### ✅ D. Migrasi & Perbaikan Infrastruktur Docker Compose
1. **Perbaikan Status `unhealthy` Node Besu:**
   * **Masalah:** Container `besu-node` terus berstatus *unhealthy* karena image minimal Hyperledger Besu tidak memiliki utilitas `wget` atau `curl` untuk pengetesan RPC port.
   * **Solusi:** Memperbarui probe healthcheck di `docker-compose.yml` menggunakan fitur soket TCP bawaan **Bash** (`cat < /dev/null > /dev/tcp/127.0.0.1/8545`). Node langsung bertransisi ke status **`healthy`** dalam 14 detik!
2. **Pembaruan Base Image ke Node 22 (WebSocket Native):**
   * **Masalah:** Supabase client pada indexer memicu *crash* karena Node 20 tidak dilengkapi dukungan WebSocket bawaan untuk memantau pembaruan data secara *real-time*.
   * **Solusi:** Mengubah base image di `Dockerfile.services` menjadi `node:22-alpine` yang memiliki WebSocket native bawaan. Sistem berjalan dengan sangat ringan dan stabil!

### ✅ E. Keberhasilan Penuh Deployment Smart Contract
* **Solusi:** Setelah node blockchain berhasil sinkron dan mendeteksi peer aktif pada ZeroTier, perintah deployer dijalankan:
  ```powershell
  docker compose --profile deploy run deployer
  ```
  **Hasil:** **14 berkas Solidity berhasil dikompilasi**, Smart Contract `LandRegistry` sukses ter-deploy, dan hak akses (roles) otomatis dialokasikan ke akun MetaMask simulasi!

---

## 📈 3. Ringkasan Hasil Utama (The Key Outputs)

### 1. Detail Smart Contract Ter-Deploy
* **Alamat Smart Contract (LandRegistry):**  
  `0x4C4a2f8c81640e47606d3fd77B353E87Ba015584`
* **Network Name:** Bhumi Network
* **Chain ID:** `31337`
* **RPC URL:** `http://localhost:8545` (atau IP ZeroTier Gilang: `http://10.223.153.80:8545`)

### 2. Hak Akses Akun MetaMask (Simulasi)
Akun-akun berikut otomatis terotorisasi pasca-deployment untuk keperluan demo:
* **Account #0 (Deployer):** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` → **Admin BPN Pusat (Owner)**
* **Account #1 (Arin):** `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` → **BPN Wilayah A**
* **Account #2 (Ihab):** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` → **BPN Wilayah B & Notaris 1**
* **Account #3:** `0x90F79bf6EB2c4f870365E785982E1f101E93b906` → **Notaris 2**
* **Account #4:** `0x7DF1C802309D4Bc9A3A694dac9c1ef8066790887` → **Auditor**

---

## 💻 4. Status Operasional Sistem Saat Ini
Saat ini, seluruh layanan pada laptop Gilang berada dalam status **AKTIF 100%** di latar belakang:

* **`bhumi-besu-node1` (Validator & Bootnode):** **`Up (healthy)`** — Aktif memproses dan meminang block transaksi.
* **`bhumi-frontend` (Website Next.js):** **`Up (Running)`** — Portal website dapat langsung dibuka di browser pada alamat **[http://localhost:3000](http://localhost:3000)**.
* **`bhumi-storage-sync` (IPFS Downloader):** **`Up (Running)`** — Aktif mengunduh file sertifikat PDF dari IPFS ke penyimpanan lokal secara otomatis.
* **`bhumi-supabase-indexer` (Database Sync):** **`Up (Running)`** — Aktif menangkap event transaksi baru dari blockchain dan menyalinnya ke database cloud Supabase.

---
*Laporan ini disimpan dalam berkas [LAPORAN_PEKERJAAN_GILANG.md](file:///c:/Tugas%20Semester%206/Blockchain/tubes/LAPORAN_PEKERJAAN_GILANG.md) pada root folder proyek Anda.* 🚀
