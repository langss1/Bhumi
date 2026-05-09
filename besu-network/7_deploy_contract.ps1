# ============================================================
# DEPLOY LandRegistry.sol ke Besu IBFT 2.0
# Jalankan dari Laptop 1 SETELAH semua 3 node aktif dan
# terhubung (cek via 6_verify_network.ps1)
# ============================================================

param(
    [string]$Network = "besu"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " DEPLOY SMART CONTRACT KE BESU       " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Network: $Network`n" -ForegroundColor Yellow

# Pastikan direktori hardhat_deploy
$scriptDir = Split-Path -Parent $PSScriptRoot
$hardhatDir = Join-Path $scriptDir "hardhat_deploy"

if (-not (Test-Path $hardhatDir)) {
    Write-Host "[ERROR] Folder hardhat_deploy tidak ditemukan di: $hardhatDir" -ForegroundColor Red
    exit 1
}

# Cek apakah Besu node berjalan
Write-Host "[1/3] Cek koneksi ke Besu node..." -ForegroundColor Yellow
try {
    $body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
    $resp = Invoke-RestMethod -Uri "http://localhost:8545" -Method POST -Body $body -ContentType "application/json"
    $chainId = [Convert]::ToInt64($resp.result, 16)
    Write-Host "      ✅ Besu node online. Chain ID: $chainId" -ForegroundColor Green
} catch {
    Write-Host "      ❌ GAGAL konek ke http://localhost:8545" -ForegroundColor Red
    Write-Host "         Pastikan 3_start_node1_LAPTOP1.ps1 sudah berjalan!" -ForegroundColor Yellow
    exit 1
}

# Deploy
Write-Host "`n[2/3] Compile & Deploy LandRegistry..." -ForegroundColor Yellow
Set-Location $hardhatDir
npx hardhat run scripts/deploy.js --network $Network

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Deploy BERHASIL!" -ForegroundColor Green
    Write-Host "`n======================================================" -ForegroundColor Green
    Write-Host " LANGKAH SELANJUTNYA:" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host " 1. Salin address contract dari output di atas" -ForegroundColor White
    Write-Host " 2. Update frontend/.env.local:" -ForegroundColor White
    Write-Host "    NEXT_PUBLIC_CONTRACT_ADDRESS=0x<ADDRESS>" -ForegroundColor Cyan
    Write-Host " 3. Copy .env.local ke Laptop 2 & 3 (address contract sama)" -ForegroundColor White
    Write-Host " 4. Restart frontend: npm run dev" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Deploy GAGAL!" -ForegroundColor Red
    Write-Host "Kemungkinan penyebab:" -ForegroundColor Yellow
    Write-Host "  - Private key di hardhat.config.js belum diganti" -ForegroundColor White
    Write-Host "  - Address deployer belum ada di genesis.json alloc" -ForegroundColor White
    Write-Host "  - Besu node belum fully synced" -ForegroundColor White
}
