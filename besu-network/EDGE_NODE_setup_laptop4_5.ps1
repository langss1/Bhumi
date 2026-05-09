# ============================================================
# EDGE NODE SETUP (LAPTOP 4 - NOTARIS & LAPTOP 5 - AUDITOR)
# Laptop 4 & 5 TIDAK menjalankan Besu.
# Mereka hanya menjalankan Frontend dan konek ke salah satu
# dari 3 Besu node yang sudah running via RPC HTTP.
# ============================================================

param(
    [string]$ContractAddress = "0xISI_SETELAH_DEPLOY",
    [string]$Node1IP         = "10.223.153.80",   # ZeroTier IP Laptop 1 (Gilang)
    [string]$Node2IP         = "ISI_IP_LAPTOP2",  # ZeroTier IP Laptop 2 (Kristo)
    [string]$Node3IP         = "ISI_IP_LAPTOP3"   # ZeroTier IP Laptop 3 (Ihab)
)

Write-Host @"
=====================================================
  BHUMI — EDGE NODE SETUP (Laptop 4 / Laptop 5)
  Role: Notaris (Farhan) atau Auditor (Arina)
=====================================================
Laptop ini TIDAK menjalankan Besu.
Frontend akan konek ke salah satu Besu validator node
via RPC (pilih node yang paling sering online).
=====================================================
"@ -ForegroundColor Cyan

# Cari node yang online
Write-Host "`n[1/3] Mencari Besu node yang online..." -ForegroundColor Yellow
$nodes = @(
    @{ name = "Laptop 1 (BPN Pusat - Gilang)";  ip = $Node1IP },
    @{ name = "Laptop 2 (BPN Wil. A - Kristo)"; ip = $Node2IP },
    @{ name = "Laptop 3 (BPN Wil. B - Ihab)";   ip = $Node3IP }
)

$activeRPC = $null
foreach ($node in $nodes) {
    try {
        $body = '{"jsonrpc":"2.0","method":"net_listening","params":[],"id":1}'
        $resp = Invoke-RestMethod -Uri "http://$($node.ip):8545" `
            -Method POST -Body $body -ContentType "application/json" -TimeoutSec 3
        if ($resp.result -eq $true) {
            Write-Host "  ✅ $($node.name) ONLINE (http://$($node.ip):8545)" -ForegroundColor Green
            if (-not $activeRPC) { $activeRPC = "http://$($node.ip):8545" }
        }
    } catch {
        Write-Host "  ⚠️  $($node.name) tidak dapat dijangkau" -ForegroundColor Yellow
    }
}

if (-not $activeRPC) {
    Write-Host "  ❌ Tidak ada Besu node yang online! Pastikan minimal 1 laptop validator running." -ForegroundColor Red
    exit 1
}

Write-Host "  → Akan menggunakan: $activeRPC" -ForegroundColor Cyan

# Buat .env.local
Write-Host "`n[2/3] Menulis .env.local..." -ForegroundColor Yellow
$frontendDir = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "frontend"
$envContent = @"
# Edge Node Config (Laptop 4/5 - Notaris/Auditor)
# Konek ke Besu validator yang online
NEXT_PUBLIC_RPC_URL=$activeRPC
NEXT_PUBLIC_CONTRACT_ADDRESS=$ContractAddress
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZDRmMzQyMS1lNmQ4LTQ5NDktYmM1NC1hMDcwNTUyYzVkMGEiLCJlbWFpbCI6ImdpbGFuZ3dhc2lzMzJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImNiNzgxMGNlN2I4NGI0NzQ4ZmMyIiwic2NvcGVkS2V5U2VjcmV0IjoiY2QzMmUzN2E1OTgyYWM5ZTQxMjY1MWIyNWViODVjZDI3MDUwMzczOWRmNWE2NmNjZWI2NWIyYmViZTM5MzQxYSIsImV4cCI6MTgwOTI0OTM3Mn0.-KMqJz9lNnb0Xlgg1EB_rn96bIW1QNN2FPmyWAdoC3M
"@

$envContent | Set-Content (Join-Path $frontendDir ".env.local") -Encoding UTF8
Write-Host "  ✅ .env.local ditulis" -ForegroundColor Green

# Install deps & jalankan
Write-Host "`n[3/3] Instalasi npm & start frontend..." -ForegroundColor Yellow
Set-Location $frontendDir
npm install --silent
Write-Host "  ✅ Siap! Menjalankan frontend..." -ForegroundColor Green
npm run dev
