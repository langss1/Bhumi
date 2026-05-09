# ============================================================
# BHUMI BESU NETWORK - SETUP SCRIPT (PowerShell)
# Jalankan di Laptop 1 (BPN Pusat) untuk generate semua keys
# ============================================================

$BASE = "C:\bhumi-besu"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " BHUMI BESU NETWORK - KEY GENERATOR  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Buat folder untuk tiap node
Write-Host "`n[1/4] Membuat folder node..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$BASE\node1\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$BASE\node2\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$BASE\node3\data" | Out-Null

# Generate node keys dan export address
Write-Host "[2/4] Generate key Node 1 (BPN Pusat)..." -ForegroundColor Yellow
besu --data-path="$BASE\node1\data" public-key export-address --to="$BASE\node1\address.txt" 2>$null

Write-Host "[3/4] Generate key Node 2 (BPN Wilayah A)..." -ForegroundColor Yellow
besu --data-path="$BASE\node2\data" public-key export-address --to="$BASE\node2\address.txt" 2>$null

Write-Host "[4/4] Generate key Node 3 (BPN Wilayah B)..." -ForegroundColor Yellow
besu --data-path="$BASE\node3\data" public-key export-address --to="$BASE\node3\address.txt" 2>$null

# Baca dan tampilkan addresses
$addr1 = Get-Content "$BASE\node1\address.txt" -ErrorAction SilentlyContinue
$addr2 = Get-Content "$BASE\node2\address.txt" -ErrorAction SilentlyContinue
$addr3 = Get-Content "$BASE\node3\address.txt" -ErrorAction SilentlyContinue

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host " HASIL NODE ADDRESSES:" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Node 1 (BPN Pusat)    : $addr1" -ForegroundColor White
Write-Host "Node 2 (BPN Wilayah A): $addr2" -ForegroundColor White
Write-Host "Node 3 (BPN Wilayah B): $addr3" -ForegroundColor White

Write-Host "`n[STEP SELANJUTNYA]" -ForegroundColor Cyan
Write-Host "Jalankan: generate_extradata.ps1" -ForegroundColor White
Write-Host "Dengan parameter addresses di atas." -ForegroundColor White
