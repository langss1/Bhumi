# ============================================================
# BHUMI BESU NETWORK - GENERATE extraData IBFT 2.0
# Jalankan SETELAH 1_generate_keys.ps1
# ============================================================

param(
    [string]$addr1 = "",
    [string]$addr2 = "",
    [string]$addr3 = ""
)

$BASE = "C:\bhumi-besu"

# Auto-baca dari file kalau parameter kosong
if (-not $addr1) { $addr1 = (Get-Content "$BASE\node1\address.txt").Trim() }
if (-not $addr2) { $addr2 = (Get-Content "$BASE\node2\address.txt").Trim() }
if (-not $addr3) { $addr3 = (Get-Content "$BASE\node3\address.txt").Trim() }

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " GENERATE extraData IBFT 2.0         " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Validators:" -ForegroundColor Yellow
Write-Host "  $addr1" -ForegroundColor White
Write-Host "  $addr2" -ForegroundColor White
Write-Host "  $addr3" -ForegroundColor White

# Generate extraData menggunakan Besu CLI
Write-Host "`nMeng-generate extraData..." -ForegroundColor Yellow
$extraData = besu rlp encode --type=IBFT_EXTRA_DATA `
    --validators="[$addr1,$addr2,$addr3]" 2>$null

if (-not $extraData) {
    Write-Host "[ERROR] Besu tidak ditemukan atau belum di PATH!" -ForegroundColor Red
    Write-Host "Download dari: https://github.com/hyperledger/besu/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host " extraData UNTUK genesis.json:" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host $extraData -ForegroundColor Cyan

# Update genesis.json otomatis
$genesisPath = "$PSScriptRoot\genesis.json"
$genesis = Get-Content $genesisPath -Raw

# Replace placeholder
$addr1_clean = $addr1.TrimStart("0x")
$addr2_clean = $addr2.TrimStart("0x")
$addr3_clean = $addr3.TrimStart("0x")

$genesis = $genesis -replace '"FILL_THIS_AFTER_STEP_2"', "`"$extraData`""
$genesis = $genesis -replace '"FILL_NODE1_ADDRESS"', "`"$addr1_clean`""
$genesis = $genesis -replace '"FILL_NODE2_ADDRESS"', "`"$addr2_clean`""
$genesis = $genesis -replace '"FILL_NODE3_ADDRESS"', "`"$addr3_clean`""

$genesis | Set-Content $genesisPath -Encoding UTF8

Write-Host "`n[✓] genesis.json berhasil diupdate!" -ForegroundColor Green
Write-Host "`n[STEP SELANJUTNYA]" -ForegroundColor Cyan
Write-Host "1. Edit genesis.json: ganti FILL_YOUR_METAMASK_DEPLOYER_ADDRESS dengan address MetaMask Anda" -ForegroundColor White
Write-Host "2. Copy genesis.json ke semua laptop" -ForegroundColor White
Write-Host "3. Copy folder node2 ke Laptop 2, node3 ke Laptop 3" -ForegroundColor White
Write-Host "4. Jalankan 3_start_node1.ps1 di Laptop 1" -ForegroundColor White
