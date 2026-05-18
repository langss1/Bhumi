# 📝 Laporan Progress Pengembangan: Bhumi DApp (Web 2.5)

**Tim Pengembangan:** Kelompok Bhumi  
**Status Terbaru:** Integrasi Web 2.5 Selesai, Auth & RBAC Berjalan 100%  

---

## 🚀 1. Capaian Fase 1: Arsitektur Hybrid & Sinkronisasi Data (Progress Kemarin)
Pada fase ini, fokus utama adalah membangun jembatan (Web 2.5) yang solid antara teknologi Blockchain tradisional (Web3) dengan infrastruktur *off-chain* berkecepatan tinggi (Web2).

* **Migrasi ke Supabase Auth:** Menggantikan sistem login usang dengan keamanan tingkat tinggi bawaan Supabase.
* **Otomatisasi Profil (Database Triggers):** Membuat *trigger* SQL di Supabase yang otomatis membuat profil pengguna baru setiap kali ada pendaftaran, serta melacak status verifikasi (`PENDING`/`APPROVED`).
* **Sinkronisasi Blockchain (Event Indexer):** Mengonfigurasi modul `bhumi-storage-sync.js` yang bertugas "mendengarkan" peristiwa/transaksi dari jaringan Hyperledger Besu, kemudian secara otomatis mendorong (*push*) metadata aset tersebut ke *database* Supabase agar mudah dicari (searchable).
* **Stabilitas Jaringan Besu:** Menyiapkan mekanisme cadangan multi-node (*multi-node fallback*) untuk memastikan koneksi ke *smart contract* tetap berjalan tanpa henti.
* **Integrasi IPFS & Dashboard Validator:** Menyelesaikan unggahan dokumen *off-chain* menggunakan IPFS Pinata, serta merampungkan alur kerja *dashboard* **BPN Pusat** untuk menyetujui peran kelembagaan (Notaris & Auditor KPK) menggunakan validasi *on-chain*.

---

## 🐞 2. Capaian Fase 2: Perbaikan Kritis Routing & RBAC (Progress Hari Ini)
Setelah fase sinkronisasi selesai, ditemukan anomali di mana pengguna yang mencoba login (khususnya BPN Wilayah dan Auditor) selalu "tersangkut" ke *dashboard* BPN Pusat atau menjumpai halaman putih kosong (Error 404). Masalah ini telah diatasi secara tuntas melalui langkah-langkah berikut:

* **Penyelesaian Bug Cache Next.js (App Router):** 
  Sistem Next.js menahan *cache* perutean (*routing*) yang menyebabkan UI tidak mau berpindah setelah login tradisional. Solusinya, perpindahan layar `router.push()` diganti dengan `window.location.href` yang sukses memutus rantai *cache* tersebut.
* **Menghubungkan Web3 Login dengan Database:** 
  Tombol "Sign in with Ethereum" sebelumnya hanya bergantung pada input *dropdown* layar (data simulasi). Kami telah merombak ulang *backend API* (`/api/auth/verify/route.ts`) agar setiap kali dompet MetaMask terhubung, *backend* akan melakukan pencocokan (*ilike*) alamat dompet tersebut ke tabel `profiles` di Supabase untuk mendapatkan peran asli (`role`) pengguna.
* **Perbaikan Konflik Case-Sensitivity pada Middleware:** 
  Masalah layar kosong (404) disebabkan oleh bentrokan penulisan huruf besar/kecil. Server menyimpan *cookie* dengan nama `BPN_WILAYAH` (kapital), sementara Middleware (`proxy.ts`) mengharapkan `bpn-wilayah` (huruf kecil). Middleware yang kebingungan mengusir pengguna ke folder kapital yang tidak pernah ada. Hal ini telah diperbaiki dengan mengonversi seluruh parameter *role* di *cookie* menjadi format *lowercase* yang selaras dengan penamaan folder Next.js.

---

## ✅ 3. Status Saat Ini & Kesimpulan
1. **Otentikasi Ganda Siap Tempur:** Baik otentikasi konvensional (Email) maupun Web3 (MetaMask Signature) kini berhasil membaca sumber kebenaran (Source of Truth) yang sama, yaitu *database* Supabase.
2. **Keamanan Lapis Dua (Middleware Berfungsi):** `proxy.ts` telah sukses menjadi satpam *Role-Based Access Control* (RBAC) yang mencegah pengguna awam menerobos masuk ke *dashboard* institusi negara.
3. **Penyatuan Kode (Merge) Sukses:** Seluruh perbaikan skrip otentikasi telah sukses di-commit dan di-push ke GitHub tanpa menyebabkan bentrok (*conflict*) dengan perbaikan UI dari rekan tim lainnya.

> **Status Proyek:** Stabil (Stable). Semua pembaruan kritis sudah berada di *branch* `main`. Sistem Bhumi Decentralized Final siap untuk masuk ke tahap demonstrasi penuh! 🚀
