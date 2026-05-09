$ErrorActionPreference = "Stop"
$BesuVersion = "24.12.0"
$ZipPath     = "$env:TEMP\besu-$BesuVersion.zip"
$TargetDir   = "C:\besu"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " DOWNLOAD & INSTALL HYPERLEDGER BESU $BesuVersion" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Cek apakah sudah terinstall
if (Test-Path "$TargetDir\bin\besu.bat") {
    $env:PATH += ";$TargetDir\bin"
    $ver = (& "$TargetDir\bin\besu.bat" --version 2>&1) | Select-String "besu" | Select-Object -First 1
    Write-Host "Besu sudah ada: $ver" -ForegroundColor Green
    Write-Host "PATH sudah diset untuk sesi ini." -ForegroundColor Green
    exit 0
}

# Download
$url = "https://github.com/hyperledger/besu/releases/download/$BesuVersion/besu-$BesuVersion.zip"
Write-Host "[1/3] Mengunduh dari: $url" -ForegroundColor Yellow
Write-Host "      Ini mungkin butuh 1-3 menit..." -ForegroundColor Yellow

try {
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($url, $ZipPath)
    $sizeMB = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
    Write-Host "      Selesai! ($sizeMB MB)" -ForegroundColor Green
} catch {
    Write-Host "GAGAL download via WebClient, mencoba Invoke-WebRequest..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $ZipPath -UseBasicParsing
    $sizeMB = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
    Write-Host "      Selesai! ($sizeMB MB)" -ForegroundColor Green
}

# Extract
Write-Host "[2/3] Mengekstrak ke C:\..." -ForegroundColor Yellow
if (Test-Path "C:\besu-$BesuVersion") { Remove-Item "C:\besu-$BesuVersion" -Recurse -Force }
if (Test-Path $TargetDir) { Remove-Item $TargetDir -Recurse -Force }
Expand-Archive -Path $ZipPath -DestinationPath "C:\" -Force
Rename-Item "C:\besu-$BesuVersion" $TargetDir
Write-Host "      Extract ke $TargetDir selesai." -ForegroundColor Green

# Set PATH sesi ini
$env:PATH += ";$TargetDir\bin"

# Set PATH permanen (Machine level)
Write-Host "[3/3] Menambahkan ke PATH sistem..." -ForegroundColor Yellow
$machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($machinePath -notlike "*$TargetDir\bin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$machinePath;$TargetDir\bin", "Machine")
    Write-Host "      PATH diperbarui. Restart terminal untuk PATH permanen." -ForegroundColor Green
} else {
    Write-Host "      PATH sudah ada." -ForegroundColor Green
}

# Verifikasi
$ver = (& "$TargetDir\bin\besu.bat" --version 2>&1) | Select-String "besu" | Select-Object -First 1
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " BERHASIL! $ver" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Besu siap digunakan di sesi ini." -ForegroundColor Green
Write-Host " Jalankan: .\0_SETUP_LAPTOP1.ps1" -ForegroundColor Cyan
