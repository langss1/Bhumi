# ============================================================
# BHUMI - ALL-IN-ONE START SCRIPT (DECENTRALIZED)
# Jalankan script ini untuk menyalakan Node + Sync Storage
# ============================================================

$BASE = "C:\bhumi-besu"

# 1. Pilih Node (Sesuaikan dengan laptop siapa ini)
$CHOICE = Read-Host "`nSiapa yang menjalankan node ini? `n1. Gilang (Laptop 1)`n2. Arin (Laptop 2)`n3. Ihab (Laptop 3)`nPilih (1/2/3)"

if ($CHOICE -eq "1") { $SCRIPT = "3_start_node1_LAPTOP1.ps1" }
elseif ($CHOICE -eq "2") { $SCRIPT = "4_start_node2_LAPTOP2.ps1" }
elseif ($CHOICE -eq "3") { $SCRIPT = "5_start_node3_LAPTOP3.ps1" }
else { Write-Host "Pilihan tidak valid."; exit }

# 2. Jalankan Besu Node di Window baru
Write-Host "`n[1/2] Menyalakan Jaringan Blockchain (Besu)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; . ./$SCRIPT"

# 3. Tunggu sebentar sampai RPC ready
Write-Host "Menunggu RPC (127.0.0.1:8545) siap..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Jalankan Storage Sync (Background)
Write-Host "[2/2] Menyalakan Sinkronisasi Storage Lokal (Bhumi-Sync)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node bhumi-storage-sync.js"

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host " BERHASIL! Node dan Storage sedang berjalan. " -ForegroundColor Green
Write-Host " Folder Penyimpanan: C:\bhumi-data\storage " -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
