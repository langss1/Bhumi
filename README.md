# Bhumi - Sistem Informasi Pertanahan Desentralisasi

Bhumi adalah sistem pendaftaran dan sertifikasi tanah berbasis Blockchain desentralisasi (Hyperledger Besu). Proyek ini dirancang menggunakan arsitektur Node Peer-to-Peer dengan integrasi Frontend Next.js dan penyimpanan dokumen desentralisasi (IPFS).

## 🗂️ Struktur Repositori Terkini

Struktur proyek ini telah dibersihkan menjadi beberapa modul utama:

- **`/frontend`** : Aplikasi Web Next.js (Dideploy ke Vercel)
- **`/contracts`** : Smart Contracts Solidity (LandRegistry.sol) dan skrip deploy (Hardhat)
- **`/blockchain`** : Konfigurasi genesis, skrip setup P2P, dan sinkronisasi layanan (Supabase/IPFS)
- **`/docker`** : Dockerfiles untuk layanan pendukung
- **`/docs`** : Seluruh panduan operasional (Setup Docker, VPS, Vercel, Troubleshooting, dll)
- **`/_archive`** : (Git-ignored) File lama, log usang, dan data lokal

## 🚀 Panduan Memulai Cepat (Quick Start)

Semua operasi kini dipusatkan menggunakan Docker Compose agar terisolasi dan mudah di-deploy di laptop manapun.

1. **Persiapan Node**
   Duplikat file template ke `.env` utama:
   ```bash
   cp .env.laptop1 .env  # Untuk Node 1 (Pusat)
   # atau cp .env.laptop2 .env untuk Node 2
   ```

2. **Jalankan Blockchain Node**
   ```bash
   docker compose up -d
   ```

3. **Membuka RPC Publik (Khusus Node Gilang/Pusat)**
   Agar Vercel dapat membaca RPC, aktifkan Ngrok tunnel:
   ```bash
   docker compose --profile tunnel up -d
   ```

## 📚 Dokumentasi Lebih Lanjut

Untuk panduan yang lebih detail sesuai dengan bagian masing-masing, silakan baca dokumentasi di dalam folder **`docs/`**:

- [Panduan Setup Docker (Untuk Semua)](docs/PANDUAN_DOCKER.md)
- [Troubleshooting Error Ngrok & Vercel](docs/PANDUAN_TROUBLESHOOTING_VERCEL_NGROK.md)
- [Panduan Setup Ihab & Arin (BPN Wilayah)](docs/PANDUAN_TEMAN_ARIN_IHAB.md)
- [Instruksi Deployer (Khusus Gilang)](docs/INSTRUKSI_UNTUK_GILANG.md)
- [Panduan Deploy VPS](docs/PANDUAN_VPS.md)
