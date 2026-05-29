# 🐋 Panduan Lengkap Setup & Instalasi Docker — Bhumi Blockchain Platform

Panduan ini berisi langkah-langkah *step-by-step* untuk menginstal, mengkonfigurasi, dan menjalankan seluruh platform blockchain **Bhumi** menggunakan **Docker Compose** secara desentralisasi. Simpan file ini sebagai referensi masa depan agar tidak lupa cara mengelola container.

---

## 📌 1. Prasyarat Awal (Prerequisites)

Sebelum memulai, pastikan laptop Anda telah terinstall perangkat lunak berikut:
1. **Docker Desktop (Windows):** Download dan install dari [Docker Official Website](https://www.docker.com/products/docker-desktop/).
   * *Rekomendasi:* Aktifkan fitur **WSL 2 backend** saat instalasi untuk performa optimal di Windows.
2. **ZeroTier One:** Download dan masuk ke jaringan ZeroTier kelompok Anda untuk mengaktifkan koneksi Peer-to-Peer (P2P).
   * Pastikan Anda bisa melakukan `ping` antar IP ZeroTier rekan kelompok.
3. **MetaMask Extension:** Dipasang di browser Chrome/Edge untuk bertransaksi dengan website.

---

## 🛠️ 2. Langkah Setup Pertama Kali (First-Time Setup)

### Langkah A: Salin Berkas Konfigurasi Lingkungan (`.env`)
Setiap laptop wajib menggunakan konfigurasi yang sesuai dengan identitasnya.
Pilih salah satu perintah di bawah ini sesuai laptop Anda dan jalankan di terminal **PowerShell**:

* **Untuk Gilang (Laptop 1):**
  ```powershell
  Copy-Item env-private/.env.laptop1 .env -Force
  ```
* **Untuk Arin (Laptop 2):**
  ```powershell
  Copy-Item env-private/.env.laptop2 .env -Force
  ```
* **Untuk Ihab (Laptop 3):**
  ```powershell
  Copy-Item env-private/.env.laptop3 .env -Force
  ```

---

### Langkah B: Daftarkan Node Key (Kunci Privat Validator)
Mesin Hyperledger Besu memerlukan kunci privat asli agar dikenali oleh konsensus jaringan. 
* Salin berkas kunci Besu lama Anda ke lokasi penempatan Docker:
  ```powershell
  # Contoh untuk Laptop 1 (Gilang):
  Copy-Item besu-network/node1/data/key docker/node-keys/node1.key -Force
  ```
* **PENTING:** Buka file `.key` yang baru disalin tersebut menggunakan Notepad, lalu **hapus awalan `0x`** di dalamnya (sisakan hanya 64 karakter hex biasa), lalu simpan kembali.

---

## 🚀 3. Cara Menjalankan Layanan (Running the Services)

Semua perintah di bawah ini wajib dijalankan dari **direktori utama (root)** proyek tempat file `docker-compose.yml` berada.

### Perintah 1: Jalankan Blockchain Node (Besu)
Nyalakan validator blockchain Anda di latar belakang:
```powershell
docker compose up -d besu-node
```
*Tunggu sekitar 15 detik sampai kontainer berstatus **`healthy`** (dapat dicek via `docker compose ps`).*

---

### Perintah 2: Deploy Smart Contract (Hanya Gilang / Laptop 1 — Sekali Saja)
Setelah blockchain menyala dan minimal 1 peer teman Anda terhubung (jaringan mulai meminang block), jalankan deployer kontainer:
```powershell
docker compose --profile deploy run deployer
```
*Perintah ini akan otomatis mengompilasi file Solidity, mendeploy-nya, mengekspor ABI kontrak, lalu otomatis berhenti saat selesai.*

---

### Perintah 3: Jalankan Frontend Website & Supabase Indexer
Setelah kontrak pintar sukses dideploy, nyalakan website portal Next.js dan indexer sinkronisasi data:
```powershell
docker compose --profile indexer up -d
```
*Sekarang portal website dapat langsung diakses di browser pada: **[http://localhost:3000](http://localhost:3000)*** 🌐

---

## 📝 4. Lembar Perintah Docker Penting (Essential Docker Cheat Sheet)

| Perintah PowerShell / CMD | Fungsi / Kegunaan |
| :--- | :--- |
| `docker compose ps` | Mengecek status keaktifan dan kesehatan (*healthcheck*) kontainer. |
| `docker compose logs -f` | Memantau seluruh *log* aktivitas kontainer secara real-time (*live stream*). |
| `docker compose logs -f besu-node` | Memantau aktivitas spesifik mesin blockchain Besu (melihat block yang ditambang/mining). |
| `docker compose logs -f supabase-indexer` | Memantau aktivitas penyelarasan database Supabase secara real-time. |
| `docker compose down` | Mematikan seluruh kontainer yang sedang berjalan dengan aman tanpa menghapus data. |
| `docker compose down -v` | **Hard Reset:** Mematikan kontainer sekaligus menghapus seluruh data blockchain (*volume data*). Sangat berguna jika ingin membersihkan blockchain dan mendeploy ulang dari block 0. |
| `docker compose --profile indexer up -d --build` | Membangun ulang (*rebuild*) citra kontainer frontend/indexer jika ada perubahan kodingan. |

---

## 🛠️ 5. Penanganan Masalah Umum (Troubleshooting)

### ❌ Masalah 1: Error `Transaction pool not enabled` pada Deployer
* **Penyebab:** Blockchain Besu berada dalam status belum sinkron atau terisolasi (0 peer aktif). IBFT 2.0 memerlukan minimal 2 validator aktif untuk mulai memproduksi block.
* **Solusi:** Hubungi rekan kelompok Anda agar mereka menyalakan node Docker mereka terlebih dahulu (`docker compose up -d besu-node`). Begitu terhubung, transaksi pool akan aktif otomatis.

### ❌ Masalah 2: Kontainer Besu Error `Permission Denied` pada database
* **Penyebab:** Docker volume dikunci oleh root permission sistem operasi WSL2/Windows.
* **Solusi:** File `docker-compose.yml` telah dikonfigurasi dengan menyertakan instruksi `user: root` pada service `besu-node` untuk melewati kendala izin akses Windows secara otomatis.

---
*Dokumen ini disimpan di [docker.md](file:///c:/Tugas%20Semester%206/Blockchain/tubes/docker.md) untuk menjadi panduan andalan Anda kapan pun.* 🚀
