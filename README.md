# Bhumi - Sistem Sertifikasi Tanah Digital (BPN)

Bhumi adalah aplikasi terdesentralisasi (DApp) berbasis Web3 yang dibangun untuk mensimulasikan sistem sertifikasi lahan digital Kementerian Agraria dan Tata Ruang / Badan Pertanahan Nasional (BPN). Aplikasi ini menggunakan konsep "Kelompok Besar A" sesuai dengan penugasan, berfokus pada tokenisasi aset tanah (ERC-721 NFT) untuk mencegah tumpang tindih lahan, dengan dukungan Multi-Signature dan integrasi dokumen IPFS.

## Arsitektur Proyek

Proyek ini telah dibersihkan dari *file* bekas/lama dan kini terbagi menjadi dua direktori utama:

```text
tubes/
├── frontend/               # Antarmuka Web3 (Next.js, TailwindCSS, Wagmi)
│   ├── src/app/            # Berisi semua Dashboard Role (User, Pusat, Wilayah, dll.)
│   ├── src/lib/wagmi.ts    # Konfigurasi RPC Node Lokal (192.168.1.5:8545)
│   └── package.json        # Dependencies frontend
│
├── hardhat_deploy/         # Lingkungan Smart Contract (Hardhat)
│   ├── contracts/          # Berisi kontrak LandRegistry.sol
│   ├── scripts/            # Script deploy.js untuk menanam kontrak ke blockchain
│   ├── hardhat.config.js   # Konfigurasi Jaringan Node Lokal
│   └── package.json        # Dependencies backend (OpenZeppelin, ethers)
│
└── README.md               # Dokumentasi ini
```

## Panduan Role Node (5 Laptop)

Aplikasi ini mendemonstrasikan sistem berbasis *Role-Based Access Control (RBAC)*. Akses dibagi menjadi 5 "Laptop/Node":
1. **Laptop 1 (BPN Pusat)**: Memiliki hak istimewa sebagai *Admin*, dapat mendaftarkan institusi baru, dan menekan tombol **Panic Button (Sengketa)** untuk memblokir status tanah.
2. **Laptop 2 & 3 (BPN Wilayah)**: Bertugas memverifikasi pendaftaran tanah baru, memeriksa IPFS Warkah & Foto Batas, lalu mencetak (*Mint*) NFT.
3. **Laptop 4 (Notaris/PPAT)**: Otoritas penengah. Memberikan *Approval* akhir pada transaksi Jual Beli (Balik Nama) dan mengunggah dokumen Akta Jual Beli (AJB).
4. **Laptop 5 (Auditor/KPK)**: Menggunakan dasbor *Read-Only* untuk mengecek silsilah kepemilikan (*Provenance Timeline*) secara forensik.
5. **Simulasi Pemilik Tanah (User)**: Dasbor publik untuk mendaftarkan aset dan mengajukan permohonan jual beli tanah (Multi-sig).

---

## Cara Menjalankan Proyek (Panduan Kelompok)

### Langkah 1: Menyiapkan Jaringan Node Lokal (Laptop Utama)
Pastikan salah satu laptop di jaringan bertindak sebagai *Host* atau RPC Node (bisa menggunakan *Hardhat Node*, *Besu IBFT*, atau *Clique*).
Alamat IP *Host* saat ini disetel ke `http://192.168.1.5:8545`. Jika berbeda, harap sesuaikan di `hardhat.config.js` dan `frontend/src/lib/wagmi.ts`.

### Langkah 2: Deploy Smart Contract
Buka terminal dan navigasikan ke folder *Smart Contract*:
```bash
cd hardhat_deploy
npm install
npx hardhat run scripts/deploy.js --network bpn_local
```
*(Catatan: Jangan lupa simpan `Contract Address` yang muncul di terminal untuk dihubungkan ke UI frontend nantinya).*

### Langkah 3: Menjalankan Frontend Web3
Buka terminal baru dan navigasikan ke folder *Frontend*:
```bash
cd frontend
npm install
npm run dev
```
Buka browser dan akses `http://localhost:3000`.

### Langkah 4: Koneksi Wallet (MetaMask)
1. Instal ekstensi MetaMask di browser.
2. Tambahkan jaringan khusus (Custom Network) di MetaMask dengan RPC `http://192.168.1.5:8545` dan Chain ID `1337`.
3. Impor *Private Key* akun dari Node lokal Anda ke MetaMask.
4. Lakukan login di halaman utama Bhumi menggunakan sistem *Sign-In With Ethereum (SIWE)* yang telah disediakan.

---

> Didesain dengan tema Moss Green & Olive yang elegan. 100% Siap untuk dipresentasikan!
