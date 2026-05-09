# ============================================================
# ALL-IN-ONE SETUP SCRIPT UNTUK LAPTOP 1 (BPN PUSAT - GILANG)
# Jalankan sekali untuk setup lengkap Besu IBFT 2.0
# ============================================================

param(
    [string]$DeployerAddress = "",
    [string]$BesuVersion     = "24.5.2"
)

$BASE      = "C:\bhumi-besu"
$BESU_DIR  = "C:\besu"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$GENESIS   = "$SCRIPT_DIR\genesis.json"

Write-Host @"
=====================================================
  BHUMI BESU IBFT 2.0 — SETUP LAPTOP 1 (BPN PUSAT)
=====================================================
Arsitektur:
  [Validator] Laptop 1 - BPN Pusat  (Gilang)  ← YOU ARE HERE
  [Validator] Laptop 2 - BPN Wilayah A (Kristo)
  [Validator] Laptop 3 - BPN Wilayah B (Ihab)
  [Edge Node] Laptop 4 - Notaris/PPAT (Farhan)  ← hanya frontend
  [Edge Node] Laptop 5 - Auditor/KPK  (Arina)   ← hanya frontend

Laptop 4 & 5 TIDAK menjalankan Besu.
Mereka konek via RPC ke Laptop 1/2/3 yang sudah running.
=====================================================
"@ -ForegroundColor Cyan

# --- STEP 1: Cek apakah Besu sudah ada ---
Write-Host "`n[STEP 1/6] Mengecek instalasi Besu..." -ForegroundColor Yellow
if (Test-Path "$BESU_DIR\bin\besu.bat") {
    $env:PATH = "$BESU_DIR\bin;" + $env:PATH
    $ver = (& "$BESU_DIR\bin\besu.bat" --version 2>&1) | Select-String "besu"
    Write-Host "  ✅ Besu ditemukan di ${BESU_DIR}: $ver" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Besu belum ditemukan di $BESU_DIR. Mengunduh Besu v$BesuVersion..." -ForegroundColor Yellow
    # ... (download logic remains but we try to be careful)
    $zipUrl  = "https://github.com/hyperledger/besu/releases/download/$BesuVersion/besu-$BesuVersion.zip"
    $zipPath = "$env:TEMP\besu-$BesuVersion.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath "C:\" -Force
    $extractedFolder = Get-ChildItem "C:\" -Filter "besu-$BesuVersion" -Directory | Select-Object -First 1
    if ($extractedFolder) {
        if (Test-Path $BESU_DIR) { Remove-Item $BESU_DIR -Recurse -Force }
        Rename-Item $extractedFolder.FullName "besu"
    }
    $env:PATH = "$BESU_DIR\bin;" + $env:PATH
    $ver = (& "$BESU_DIR\bin\besu.bat" --version 2>&1) | Select-String "besu"
    Write-Host "  ✅ Besu terinstall: $ver" -ForegroundColor Green
}

# --- STEP 2: Buat folder node ---
Write-Host "`n[STEP 2/6] Membuat folder node..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$BASE\node1\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$BASE\node2\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$BASE\node3\data" | Out-Null
Write-Host "  ✅ Folder: $BASE\node1, node2, node3" -ForegroundColor Green

# --- STEP 3: Generate node keys ---
Write-Host "`n[STEP 3/6] Generate Node Keys..." -ForegroundColor Yellow
$addrFiles = @("$BASE\node1\address.txt", "$BASE\node2\address.txt", "$BASE\node3\address.txt")
$nodeNames = @("Node 1 (BPN Pusat)", "Node 2 (BPN Wil. A)", "Node 3 (BPN Wil. B)")
$dataPaths = @("$BASE\node1\data", "$BASE\node2\data", "$BASE\node3\data")

for ($i = 0; $i -lt 3; $i++) {
    if (-not (Test-Path $addrFiles[$i])) {
        Write-Host "  Generating key $($nodeNames[$i])..." -ForegroundColor White
        & "$BESU_DIR\bin\besu.bat" --data-path=$($dataPaths[$i]) public-key export-address --to=$($addrFiles[$i])
    }
}

$addr1 = (Get-Content "$BASE\node1\address.txt").Trim()
$addr2 = (Get-Content "$BASE\node2\address.txt").Trim()
$addr3 = (Get-Content "$BASE\node3\address.txt").Trim()

Write-Host "  ✅ Addresses:" -ForegroundColor Green
Write-Host "     Node1 (BPN Pusat)  : $addr1" -ForegroundColor White
Write-Host "     Node2 (BPN Wil. A) : $addr2" -ForegroundColor White
Write-Host "     Node3 (BPN Wil. B) : $addr3" -ForegroundColor White

# --- STEP 4: Generate extraData ---
Write-Host "`n[STEP 4/6] Generate extraData IBFT 2.0..." -ForegroundColor Yellow
$rlpJsonFile = "$env:TEMP\validators.json"
$validatorsJson = "[`"$addr1`", `"$addr2`", `"$addr3`"]"
$validatorsJson | Set-Content $rlpJsonFile -Encoding Ascii
$rlpResult = (& "$BESU_DIR\bin\besu.bat" rlp encode --type=IBFT_EXTRA_DATA --from=$rlpJsonFile 2>&1)
$extraData = ($rlpResult | Where-Object { $_ -match "^0x[0-9a-fA-F]+$" }).Trim()

if (-not $extraData) {
    Write-Host "  ❌ Gagal generate extraData!" -ForegroundColor Red
    Write-Host "  Output Besu: $rlpResult" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✅ extraData: $($extraData.Substring(0, [Math]::Min(40, $extraData.Length)))..." -ForegroundColor Green

# --- STEP 5: Tulis genesis.json final ---
Write-Host "`n[STEP 5/6] Menulis genesis.json..." -ForegroundColor Yellow

# Deployer: gunakan private key Hardhat #0 sebagai default (bisa diganti MetaMask)
# Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
$DEPLOYER_ADDRESS = if ($DeployerAddress) { $DeployerAddress.TrimStart("0x") } else { "f39Fd6e51aad88F6F4ce6aB8827279cffFb92266" }
$DEPLOYER_NOTE    = if ($DeployerAddress) { "MetaMask Anda" } else { "Hardhat Test Account #0 (0xf39F...2266)" }

$addr1_clean = $addr1.TrimStart("0x")
$addr2_clean = $addr2.TrimStart("0x")
$addr3_clean = $addr3.TrimStart("0x")

$genesisContent = @"
{
  "config": {
    "chainId": 1337,
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
  "extraData": "$extraData",
  "alloc": {
    "$addr1_clean": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    },
    "$addr2_clean": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    },
    "$addr3_clean": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    },
    "$DEPLOYER_ADDRESS": {
      "balance": "0x200000000000000000000000000000000000000000000000000000000000000"
    }
  }
}
"@

$genesisContent | Set-Content "$GENESIS" -Encoding UTF8
Write-Host "  ✅ genesis.json ditulis. Deployer: $DEPLOYER_NOTE" -ForegroundColor Green
Write-Host "  > $GENESIS" -ForegroundColor Cyan

# --- STEP 6: Tampilkan summary dan instruksi selanjutnya ---
Write-Host '=====================================================' -ForegroundColor Green
Write-Host '  SETUP LAPTOP 1 SELESAI!' -ForegroundColor Green
Write-Host '=====================================================' -ForegroundColor Green
Write-Host ''
Write-Host 'FILES UNTUK DIKOPI KE LAPTOP 2 (Kristo - BPN Wilayah A):' -ForegroundColor Cyan
Write-Host ('  Copy folder: ' + $BASE + '\node2\') -ForegroundColor White
Write-Host ('  Copy file:   ' + $GENESIS) -ForegroundColor White
Write-Host '  besu-network\4_start_node2_LAPTOP2.ps1' -ForegroundColor White
Write-Host ''
Write-Host 'FILES UNTUK DIKOPI KE LAPTOP 3 (Ihab - BPN Wilayah B):' -ForegroundColor Cyan
Write-Host ('  Copy folder: ' + $BASE + '\node3\') -ForegroundColor White
Write-Host ('  Copy file:   ' + $GENESIS) -ForegroundColor White
Write-Host '  besu-network\5_start_node3_LAPTOP3.ps1' -ForegroundColor White
Write-Host ''
Write-Host 'LAPTOP 4 (Farhan - Notaris) & LAPTOP 5 (Arina - Auditor):' -ForegroundColor Cyan
Write-Host '  Hanya perlu: git clone + npm install + .env.local' -ForegroundColor White
Write-Host '  TIDAK perlu install Besu!' -ForegroundColor Yellow
Write-Host ""
Write-Host 'LANGKAH BERIKUTNYA:' -ForegroundColor Cyan
Write-Host '  1. Jalankan: .\3_start_node1_LAPTOP1.ps1' -ForegroundColor White
Write-Host '  2. Setelah block mulai: .\7_deploy_contract.ps1' -ForegroundColor White
Write-Host '  3. Update .env.local dengan contract address' -ForegroundColor White
Write-Host '  4. Jalankan: cd ..\frontend; npm run dev' -ForegroundColor White
