# 🛠️ Cheat Sheet Perintah (Command) Esensial Bhumi

Gunakan dokumen ini sebagai contekan (*cheat sheet*) untuk menjalankan perintah-perintah yang paling sering digunakan selama masa pengembangan dan demo proyek Bhumi.

---

## 🐋 1. Manajemen Docker (Node & Services)
Pastikan kamu berada di folder root proyek (`Bhumi/`) sebelum menjalankan perintah ini.

| Tujuan | Perintah Windows PowerShell |
| :--- | :--- |
| **Menyalakan Node Lokal** | `docker compose up -d` |
| **Menyalakan Node + Ngrok (Khusus Gilang)** | `docker compose --profile tunnel up -d` |
| **Mematikan Seluruh Node & Services** | `docker compose down` |
| **Melihat Daftar Kontainer yang Berjalan** | `docker compose ps` |
| **Melihat Log Blockchain (Real-time)** | `docker compose logs besu-node -f` |
| **Melihat Log Ngrok (Untuk ambil link)** | `docker compose logs rpc-tunnel` |
| **Melihat Log Penyinkron File** | `docker compose logs storage-sync -f` |

---

## 🔗 2. Pengecekan Jaringan Blockchain (RPC)
Perintah ini menggunakan `curl.exe` bawaan Windows untuk bertanya langsung ke Blockchain Node kalian (Besu) yang sedang berjalan di port `8545`.

> **Tips:** Jalankan perintah ini di PowerShell saat kontainer `besu-node` berstatus `Up`.

### 🟢 Mengecek Jumlah Node/Teman yang Terhubung (Peer Count)
```powershell
curl.exe -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' http://localhost:8545
```
*(Hasil kembaliannya berupa angka hex, misalnya `"result":"0x2"` berarti ada 2 laptop teman yang terhubung ke laptopmu).*

### 🟢 Melihat Daftar Detail Peer (IP Address ZeroTier Teman)
```powershell
curl.exe -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}' http://localhost:8545
```
*(Melihat siapa saja yang saat ini tersambung beserta IP address ZeroTier mereka).*

### 🟢 Mengecek Blok Terakhir Saat Ini (Block Number)
```powershell
curl.exe -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
```
*(Jika nilai block number antar laptop sama, berarti jaringan kalian sudah sinkron sempurna!).*

---

## 🌐 3. Menjalankan Website (Frontend)
Untuk Farhan atau siapapun yang ingin menjalankan website secara lokal untuk keperluan testing:

1. Masuk ke folder frontend:
   ```powershell
   cd frontend
   ```
2. Install dependency (hanya jika baru pertama kali atau ada library baru):
   ```powershell
   npm install
   ```
3. Jalankan server lokal:
   ```powershell
   npm run dev
   ```
4. Buka di browser: `http://localhost:3000`

---

## 📜 4. Smart Contract (Khusus Gilang / Deployer)
Perintah ini digunakan jika ada perubahan logika pada file Solidity (`LandRegistry.sol`).

1. Masuk ke folder contracts:
   ```powershell
   cd contracts
   ```
2. Compile ulang kontrak pintar:
   ```powershell
   npx hardhat compile
   ```
3. Deploy kontrak pintar ke jaringan lokal (Docker Node 1 harus menyala):
   ```powershell
   npx hardhat run scripts/deploy.js --network local
   ```
   *(Atau gunakan Docker Deployer: `docker compose --profile deploy up deployer` dari folder root).*

---

## 💡 Tips Tambahan
* Jika suatu saat jaringan terasa *nyangkut* atau error tidak terduga, cara paling ampuh untuk mereset/menyegarkan *state* kontainer Docker adalah mematikannya secara penuh lalu menyalakannya lagi:
  ```powershell
  docker compose down
  docker compose up -d
  ```
