# Panduan Deployment Bhumi ke VPS (Docker Version)

Karena VPS Anda sudah menggunakan Docker (seperti di project Uangku), panduan ini telah disesuaikan agar deployment Bhumi menggunakan **Docker & Docker Compose**. Cara ini jauh lebih bersih dan tidak bentrok dengan aplikasi lain!

## 1. Persiapan Folder di VPS

Login ke VPS Anda via SSH, lalu buat folder baru untuk Bhumi:

```bash
# Masuk ke direktori /var/www atau home Anda
cd /var/www

# Buat folder bhumi
mkdir bhumi
cd bhumi
```

## 2. Memasukkan Source Code ke VPS

Kirimkan folder `frontend` (dari `Bhumi_Decentralized_Final/frontend`) ke dalam folder `bhumi` di VPS Anda menggunakan SFTP/SCP, atau via `git clone`.

Pastikan di dalam folder `frontend` di VPS sudah terdapat file:
- `Dockerfile` (sudah saya buatkan)
- `docker-compose.yml` (sudah saya buatkan)

## 3. Konfigurasi Environment Variables

Pindah ke direktori `frontend` dan buat file `.env.local`:

```bash
cd frontend
nano .env.local
```

Isi dengan variabel berikut (silakan *copy-paste* dari lokal Anda):
```env
NEXT_PUBLIC_RPC_URL=http://<IP_LAPTOP_NODE_BESU>:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_PINATA_JWT=eyJhb...
NEXT_PUBLIC_SUPABASE_URL=https://mcfavdollxnpihkmnnry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON=eyJhb...

# Konfigurasi SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=alphadeveloper.it@gmail.com
SMTP_PASS=qowyiddipdavyjne
```

## 4. Jalankan Aplikasi dengan Docker Compose

Karena file `docker-compose.yml` sudah disiapkan untuk mengekspos aplikasi di **port 3003**, aplikasi ini tidak akan bentrok dengan Uangku atau Web Anda yang lain.

Cukup jalankan perintah sakti ini:

```bash
# Build image dan jalankan container di background (-d)
docker-compose up -d --build
```

Docker otomatis akan menginstal Node.js di dalam *container*, melakukan `npm run build`, dan menjalankan servernya!

### Mengecek Status Container
Untuk memastikan aplikasi berjalan dengan baik:
```bash
docker-compose ps
# Atau lihat log:
docker-compose logs -f
```

## 5. Reverse Proxy (Nginx) - Opsional

Jika Anda memiliki domain (misal: `bhumi.domain-anda.com`), Anda bisa arahkan Nginx ke port `3003` yang digunakan oleh *container* Docker:

```nginx
server {
    listen 80;
    server_name bhumi.domain-anda.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Jangan lupa me-restart Nginx: `sudo systemctl restart nginx`.
