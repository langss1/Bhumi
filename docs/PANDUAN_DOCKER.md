# Panduan Menjalankan Bhumi Menggunakan Docker

Sistem Bhumi Blockchain ini dirancang untuk dijalankan di **3 laptop (mesin) yang berbeda** (Gilang, Arin, dan Ihab), yang saling terhubung melalui ZeroTier.

Masing-masing laptop akan menjalankan stack Docker-nya sendiri. Docker Compose akan mengelola 1 Node Blockchain (Besu), 1 Frontend (Next.js), dan layanan sinkronisasi file secara bersamaan.

---

## 1. Persiapan Awal (Untuk Semua Laptop)

Pastikan kamu sudah:
1. **Menginstall Docker dan Docker Compose**.
2. **Terhubung ke VPN ZeroTier** dan bisa saling *ping* antar IP ZeroTier (10.223.153.xxx).

## 2. Cara Menjalankan Berdasarkan Peran Laptop

Masuk ke folder project Bhumi di terminal/command prompt:
```bash
cd /path/to/Bhumi
```

### 💻 Laptop 1 (Gilang - BPN Pusat)
Jalankan perintah ini:
```bash
cp .env.laptop1 .env
docker compose up -d
```
> **Khusus Gilang (Hanya saat pertama kali / reset data):**
> Kamu perlu men-deploy Smart Contract ke jaringan:
> ```bash
> docker compose --profile deploy run deployer
> ```

### 💻 Laptop 2 (Arin - BPN Wilayah A)
Jalankan perintah ini:
```bash
cp .env.laptop2 .env
docker compose up -d
```

### 💻 Laptop 3 (Ihab - BPN Wilayah B)
Jalankan perintah ini:
```bash
cp .env.laptop3 .env
docker compose up -d
```

---

## 3. Cara Mengakses Aplikasi

Setelah semua container berjalan (status "running" tanpa error), kamu bisa mengakses:

- **Website Frontend**: Buka `http://localhost:3000` di browser.
- **RPC Blockchain**: Tersedia di `http://localhost:8545`. (Hubungkan MetaMask kamu ke RPC ini dengan Chain ID `31337`).

## 4. Perintah Berguna (Troubleshooting)

**Melihat daftar container yang berjalan:**
```bash
docker compose ps
```

**Melihat log/aktivitas (sangat berguna untuk mencari error):**
```bash
# Log untuk semua container
docker compose logs -f

# Log untuk Node Blockchain saja
docker compose logs -f besu-node

# Log untuk Frontend saja
docker compose logs -f frontend

# Log untuk Storage Sync
docker compose logs -f storage-sync
```

**Menghentikan semua container:**
```bash
docker compose down
```

**Menghentikan semua container dan MENGHAPUS DATA Blockchain (Reset Ulang):**
```bash
docker compose down -v
```
*(Hati-hati: menggunakan flag `-v` akan menghapus persisten volume data blockchain Besu dan sertifikat IPFS).*

## 5. Fitur Tambahan (Opsional)

Jika kamu ingin menyalakan fitur **Supabase Indexer** (mengirim aktivitas blockchain ke database cloud Supabase), gunakan profile `indexer`:

```bash
docker compose --profile indexer up -d supabase-indexer
```
*(Cukup dinyalakan di 1 laptop saja, misalnya laptop Gilang).*

---

## 6. Mengakses Jaringan dari Publik (Vercel / Dosen)

Jika dosen meminta aplikasi ini bisa diakses secara publik (contoh: via Vercel) **tanpa harus menginstall ZeroTier**, kita harus membocorkan (tunneling) RPC Node Gilang ke internet menggunakan Ngrok.

**Langkah-langkah untuk Gilang:**
1. Daftar akun gratis di [ngrok.com](https://ngrok.com).
2. Dapatkan token dari menu *Your Authtoken*.
3. Buka file `.env.laptop1` dan isi tokennya: `NGROK_AUTHTOKEN="<token_kamu_di_sini>"`
4. Setelah file `.env` diubah, jalankan ulang docker dan nyalakan profile tunnel:
   ```bash
   cp .env.laptop1 .env
   docker compose down
   docker compose --profile tunnel up -d
   ```
5. Lihat URL publik yang diberikan oleh Ngrok dengan menjalankan:
   ```bash
   docker compose logs rpc-tunnel | grep "url="
   ```
   *Atau Gilang juga bisa membuka browser di `http://localhost:4040` untuk melihat dashboard Ngrok.*
6. Buka dashboard Vercel, lalu edit Environment Variables `NEXT_PUBLIC_RPC_URL` menjadi URL Ngrok tadi (contoh: `https://abcd-123.ngrok-free.app`). **Jangan pakai garis miring (/) di akhir URL!**
7. Selesai! Dosen sekarang bisa membuka website Vercel kalian dan MetaMask-nya akan bisa terhubung ke Blockchain lokal kalian lewat terowongan Ngrok ini.
