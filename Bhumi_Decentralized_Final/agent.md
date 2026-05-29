# Instruksi untuk AI Agent (Pengembangan Fitur Keamanan Private Key)

Halo! Agent sebelumnya telah menyelesaikan pembuatan Halaman Profil (`/dashboard/profile/page.tsx`) dengan fitur sensor Wallet Address dan *password protection*. 

Namun, fitur untuk **menyimpan dan menampilkan Private Key** belum diimplementasikan karena keterbatasan akses ke database Supabase. 

**Tugas Anda sekarang adalah melanjutkan pekerjaan tersebut dengan instruksi berikut:**

### 1. Sinkronisasi Kode (Pull & Fix)
- Lakukan `git pull origin main` untuk memastikan Anda memiliki versi kode frontend terbaru.
- Pelajari komponen `frontend/src/app/dashboard/profile/page.tsx` dan `frontend/src/components/PendingVerificators.tsx`.

### 2. Modifikasi Database (Berikan Query SQL)
- Karena Private Key sebelumnya tidak pernah disimpan ke database demi keamanan Web3, kita sekarang harus menyimpannya secara eksplisit.
- **Berikan instruksi Query SQL** berikut kepada pengguna agar mereka menjalankannya di SQL Editor Supabase mereka:
  ```sql
  ALTER TABLE profiles ADD COLUMN private_key TEXT;
  ```

### 3. Implementasi Kode Backend & Frontend
- Buka `frontend/src/lib/supabase.ts`. Tambahkan `private_key?: string;` ke dalam antarmuka `DBProfile`.
- Buka `frontend/src/components/PendingVerificators.tsx`. Saat sistem meng-*generate* wallet otomatis (menggunakan `generatePrivateKey()`), pastikan nilai `privateKey` tersebut ikut dikirim dan disimpan ke database bersamaan dengan pembaruan status `verification_status: 'APPROVED'`.
- Buka `frontend/src/app/dashboard/profile/page.tsx`. 
  - Tambahkan kembali elemen UI untuk menampilkan **Private Key**. 
  - Private Key harus dalam kondisi tersensor secara default. 
  - Saat pengguna mengklik "Lihat Dompet" dan berhasil memverifikasi *password* mereka, tampilkan `profile.private_key` secara utuh beserta tombol salin (*copy*).

### 4. Push Perubahan
- Uji kode Anda untuk memastikan tidak ada *error* TypeScript atau *build*.
- Lakukan `git add`, `git commit`, dan `git push` setelah seluruh fitur ini selesai dan berjalan lancar.
