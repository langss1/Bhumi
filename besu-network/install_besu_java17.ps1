$ErrorActionPreference = "Stop"

# Besu 24.5.2 = versi terakhir yang support Java 17
$BesuVersion = "24.5.2"
$ZipPath     = "$env:TEMP\besu-$BesuVersion.zip"
$TargetDir   = "C:\besu"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " INSTALL BESU $BesuVersion (Java 17 compatible)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Hapus versi lama jika ada
if (Test-Path $TargetDir) {
    Write-Host " Menghapus Besu lama..." -ForegroundColor Yellow
    Remove-Item $TargetDir -Recurse -Force
}

# Download
$url = "https://github.com/hyperledger/besu/releases/download/$BesuVersion/besu-$BesuVersion.zip"
Write-Host "[1/3] Mengunduh Besu $BesuVersion (~130MB)..." -ForegroundColor Yellow

$webClient = New-Object System.Net.WebClient
$webClient.DownloadFile($url, $ZipPath)
$sizeMB = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host "      Selesai! ($sizeMB MB)" -ForegroundColor Green

# Extract
Write-Host "[2/3] Mengekstrak ke C:\besu..." -ForegroundColor Yellow
Expand-Archive -Path $ZipPath -DestinationPath "C:\" -Force
$extracted = Get-ChildItem "C:\" -Filter "besu-$BesuVersion" -Directory | Select-Object -First 1
if ($extracted) { Rename-Item $extracted.FullName $TargetDir }
Write-Host "      Selesai!" -ForegroundColor Green

# Set PATH user level
Write-Host "[3/3] Setting PATH (user level)..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$TargetDir\bin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$TargetDir\bin", "User")
}
$env:PATH = "$TargetDir\bin;" + $env:PATH
Write-Host "      PATH diset untuk sesi ini." -ForegroundColor Green

# Verifikasi
Write-Host ""
$result = & "$TargetDir\bin\besu.bat" --version 2>&1
$verLine = ($result | Where-Object { $_ -match "besu" } | Select-Object -First 1)
Write-Host "=============================================" -ForegroundColor Green
Write-Host " BERHASIL! $verLine" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Besu siap! Menjalankan 0_SETUP_LAPTOP1.ps1..." -ForegroundColor Cyan
