# ============================================================
# SETUP SINGLE NODE MODE (UNTUK DEMO 1 LAPTOP)
# Mengubah network agar bisa jalan hanya dengan 1 validator
# ============================================================

$BASE      = "C:\bhumi-besu"
$BESU_DIR  = "C:\besu"
$SCRIPT_DIR = $PSScriptRoot
$GENESIS   = "$SCRIPT_DIR\genesis.json"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  BHUMI BESU -- SETTING UP SINGLE NODE MODE" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Ambil address Node 1
$addr1 = (Get-Content "$BASE\node1\address.txt").Trim()
Write-Host "Validator: $addr1" -ForegroundColor Yellow

# 2. Generate extraData (hanya 1 validator)
Write-Host "Generating extraData for 1 validator..." -ForegroundColor Yellow
$rlpJsonFile = "$env:TEMP\validators_single.json"
$validatorsJson = "[`"$addr1`"]"
$validatorsJson | Set-Content $rlpJsonFile -Encoding Ascii
$extraData = (& "$BESU_DIR\bin\besu.bat" rlp encode --type=IBFT_EXTRA_DATA --from=$rlpJsonFile 2>&1 | Where-Object { $_ -match "^0x[0-9a-fA-F]+$" }).Trim()

if (-not $extraData) {
    Write-Host "X Gagal generate extraData!" -ForegroundColor Red
    exit 1
}

# 3. Update genesis.json
Write-Host "Updating genesis.json..." -ForegroundColor Yellow
$DEPLOYER = "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Hardhat #0
$addr1_clean = $addr1.TrimStart("0x")

$genesisContent = @'
{
  "config": {
    "chainId": 31337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "shanghaiBlock": 0,
    "cancunBlock": 0,
    "zeroBaseFee": true,
    "ibft2": {
      "blockperiodseconds": 2,
      "epochlength": 30000,
      "requesttimeoutseconds": 4
    }
  },
  "nonce": "0x0",
  "timestamp": "0x58ee40ba",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "extraData": "EXTRA_DATA_PLACEHOLDER",
  "alloc": {
    "ADDR1_PLACEHOLDER": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    },
    "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    }
  }
}
'@

$genesisContent = $genesisContent.Replace("EXTRA_DATA_PLACEHOLDER", $extraData)
$genesisContent = $genesisContent.Replace("ADDR1_PLACEHOLDER", $addr1_clean)

$genesisContent | Set-Content "$GENESIS" -Encoding UTF8
Copy-Item "$GENESIS" -Destination "$BASE\genesis.json" -Force

# 4. Reset Data Node 1 (wajib karena genesis berubah)
Write-Host "Resetting Node 1 data..." -ForegroundColor Yellow
Remove-Item "$BASE\node1\data\besu.networks" -ErrorAction SilentlyContinue
Remove-Item "$BASE\node1\data\database" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$BASE\node1\data\caches" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n[V] SUCCESS! Network dikonfigurasi untuk 1 validator." -ForegroundColor Green
Write-Host "Sekarang jalankan: .\3_start_node1_LAPTOP1.ps1" -ForegroundColor Cyan
