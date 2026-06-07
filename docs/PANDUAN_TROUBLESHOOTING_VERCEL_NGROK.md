# Panduan Troubleshooting & Setup Vercel + Ngrok (Bhumi Blockchain)

Dokumen ini berisi ringkasan seluruh kendala dan solusi yang telah dilakukan selama proses menghubungkan local node (Gilang) ke website publik Vercel (Farhan) menggunakan Ngrok, serta penyelesaian masalah koneksi MetaMask.

## 1. Kendala PowerShell & Environment Variable
* **Masalah `curl` di PowerShell:** Menjalankan `curl -H` di Windows PowerShell menyebabkan error karena `curl` adalah alias untuk `Invoke-WebRequest`. 
  * **Solusi:** Gunakan perintah `curl.exe` agar mengeksekusi program cURL asli bawaan Windows (bypass PowerShell alias).
* **`grep BOOTNODES` Kosong:** Perintah `docker compose exec besu-node env` tidak menampilkan parameter `BOOTNODES` karena variabel tersebut diteruskan sebagai argumen *command line* (CLI) ke aplikasi Besu, bukan sebagai *environment variable* di dalam sistem operasi kontainer.

## 2. Setup Ngrok RPC Tunnel (Laptop Gilang)
* **Masalah Ngrok Tidak Menyala:** Service `rpc-tunnel` di `docker-compose.yml` berada di bawah profil `tunnel`. Jadi, jika hanya menjalankan `docker compose up -d`, service ini akan diabaikan.
  * **Solusi:** Harus dijalankan dengan perintah khusus:
    ```powershell
    docker compose --profile tunnel up -d
    ```
* **Error `ERR_NGROK_4018` (Authtoken Kosong):** Ngrok gagal menyala karena file `.env` yang digunakan Docker tidak memiliki nilai `NGROK_AUTHTOKEN`.
  * **Solusi:** Mendaftar di ngrok.com, menyalin Authtoken, dan mem-paste ke file `.env` milik Gilang.
  * **Penting:** Jika Gilang mengedit file `.env.laptop1`, ia wajib melakukan *copy* menjadi `.env` (`cp .env.laptop1 .env`) sebelum me-restart Docker agar perubahannya terbaca.
* **Mendapatkan Link Publik:** Link HTTPS Ngrok dapat diambil dengan membaca log kontainer:
  ```powershell
  docker compose logs rpc-tunnel
  ```

## 3. Integrasi URL Ngrok ke Vercel (Peran Farhan)
Agar website Vercel bisa membaca data blockchain dari laptop Gilang, Vercel harus diarahkan ke URL Ngrok Gilang yang sedang aktif.
* **Cara 1 (Dashboard Vercel - Rekomendasi):** Buka tab Settings -> Environment Variables, ubah value `NEXT_PUBLIC_RPC_URL` menjadi URL Ngrok, lalu ke tab Deployments dan lakukan **Redeploy**.
* **Cara 2 (Ubah Kode Lokal):** Hardcode URL tersebut di dalam file `frontend/src/lib/wagmi.ts`, lalu lakukan komit dan `git push` ke GitHub agar Vercel melakukan redeploy otomatis.

## 4. Supabase & Data Blockchain Lama yang Tertinggal
* **Masalah:** Meskipun blockchain lokal sudah ter-reset dan mulai dari awal di dalam Docker, website Vercel masih menampilkan data sertifikat lama.
* **Penyebab:** Frontend Vercel mengambil dan menyusun daftar ledger bukan dengan melakukan query satu per satu ke blockchain, melainkan dari database cloud **Supabase** (demi kecepatan pencarian/UI). Data riwayat transaksi lama masih tersimpan di tabel Supabase tersebut.
* **Solusi:** Buka dashboard Supabase, buka menu **Table Editor**, lalu hapus (*delete rows*) seluruh data pada tabel `asset_metadata` dan `activity_log`. 
  * 🚨 **Perhatian:** Jangan menghapus data pada tabel `profiles` atau `users` agar akun login anggota BPN dan Notaris tidak hilang.

## 5. Error AccessControl MetaMask (Missing Role BPN Pusat)
* **Masalah:** Saat akan menyetujui (Approve) pengajuan tanah di dashboard BPN Pusat, MetaMask menolak transaksi (*revert*) dengan pesan error: `AccessControl: account ... is missing role 0x9856...` (kode hash untuk wewenang `ADMIN_BPN_ROLE`).
* **Penyebab:** Meskipun UI ekstensi MetaMask sudah diarahkan ke akun *BPN ASLI* (`0xf39Fd...`), website Vercel masih terkunci pada koneksi dari dompet sebelumnya (`0x4939...`). Dompet sebelumnya tidak memiliki wewenang administratif pada smart contract.
* **Solusi:**
  1. Buka MetaMask, masuk ke menu **Dapp connections**.
  2. Putuskan koneksi (*Disconnect*) akun lama dari situs `bhumi-web-three.vercel.app`.
  3. Keluar (*Logout*) dari website BPN Pusat.
  4. Lakukan *Hard Refresh* pada browser (Tekan `Ctrl+F5`).
  5. Login kembali, klik "Connect Wallet", dan pastikan memberi izin koneksi ke akun **BPN ASLI** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`).
