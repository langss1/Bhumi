# ============================================================
# ALL-IN-ONE AUTOMATIC SETUP UNTUK TEMAN (ARIN & IHAB)
# Jalankan script ini sekali saja!
# ============================================================

$BASE      = "C:\bhumi-besu"
$BESU_DIR  = "C:\besu"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   BHUMI AUTOMATIC SETUP - VALIDATOR NODE            " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# --- STEP 1: Instalasi Besu Otomatis ---
Write-Host "`n[1/4] Mengecek instalasi Besu..." -ForegroundColor Yellow
if (-not (Test-Path "$BESU_DIR\bin\besu.bat")) {
    Write-Host "  ⚠️ Besu tidak ditemukan. Mengunduh Besu..." -ForegroundColor Yellow
    $zipUrl  = "https://github.com/hyperledger/besu/releases/download/24.5.2/besu-24.5.2.zip"
    $zipPath = "$env:TEMP\besu.zip"
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath "C:\" -Force
    Rename-Item "C:\besu-24.5.2" "besu"
    Write-Host "  ✅ Besu berhasil terinstall di C:\besu" -ForegroundColor Green
} else {
    Write-Host "  ✅ Besu sudah siap." -ForegroundColor Green
}

# --- STEP 2: Deteksi IP ZeroTier Otomatis ---
Write-Host "`n[2/4] Mendeteksi IP Jaringan Privat (ZeroTier/Radmin)..." -ForegroundColor Yellow
$myIp = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and ($_.InterfaceAlias -like '*ZeroTier*' -or $_.InterfaceAlias -like '*Radmin*') }).IPAddress | Select-Object -First 1

if (!$myIp) {
    $myIp = Read-Host "  ⚠️ Gagal deteksi IP otomatis. Masukkan IP ZeroTier kamu"
}
Write-Host "  ✅ IP Kamu: $myIp" -ForegroundColor Green

# --- STEP 3: Update Network Config ---
Write-Host "`n[3/4] Mengonfigurasi Jaringan..." -ForegroundColor Yellow
$configPath = "$SCRIPT_DIR\network_config.ps1"
if (Test-Path $configPath) {
    $content = Get-Content $configPath
    # Deteksi apakah ini Arin (Laptop 2) atau Ihab (Laptop 3)
    $choice = Read-Host "  Kamu siapa? `n  2. Arin (Wilayah A)`n  3. Ihab (Wilayah B)`n  Pilih (2/3)"
    
    if ($choice -eq "2") {
        $content = $content -replace '\$IP_LAPTOP2 = ".*"', "`$IP_LAPTOP2 = `"$myIp`""
        Write-Host "  ✅ IP Arin diupdate ke: $myIp" -ForegroundColor Green
    } else {
        $content = $content -replace '\$IP_LAPTOP3 = ".*"', "`$IP_LAPTOP3 = `"$myIp`""
        Write-Host "  ✅ IP Ihab diupdate ke: $myIp" -ForegroundColor Green
    }
    $content | Set-Content $configPath
}

# --- STEP 4: Copy Node Identities & Genesis ---
Write-Host "`n[4/5] Menyiapkan Identitas Node (Kunci) dan Genesis..." -ForegroundColor Yellow
if (!(Test-Path $BASE)) { New-Item -ItemType Directory -Path $BASE -Force | Out-Null }

# Copy genesis.json
if (Test-Path "$SCRIPT_DIR\genesis.json") {
    Copy-Item -Path "$SCRIPT_DIR\genesis.json" -Destination "$BASE\genesis.json" -Force
    Write-Host "  ✅ File genesis.json berhasil disiapkan di $BASE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ File genesis.json tidak ditemukan di folder besu-network!" -ForegroundColor Red
}

$identitySource = "$SCRIPT_DIR\..\node-identities"
if (Test-Path $identitySource) {
    Copy-Item -Path "$identitySource\*" -Destination $BASE -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ File kunci berhasil disiapkan di $BASE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Folder node-identities tidak ditemukan. Pastikan file kunci sudah ada di $BASE" -ForegroundColor Yellow
}

# --- STEP 5: Install Dependencies (Storage Sync) ---
Write-Host "`n[5/5] Memasang dependensi (npm install)..." -ForegroundColor Yellow
cd "$SCRIPT_DIR\..\frontend"
npm install
cd "$SCRIPT_DIR\..\hardhat_deploy"
npm install

Write-Host "`n=====================================================" -ForegroundColor Green
Write-Host "   SETUP SELESAI! SEMUA SIAP.                        " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Untuk mulai, jalankan: .\START_NODE_FULL_DECENTRALIZED.ps1" -ForegroundColor Cyan
