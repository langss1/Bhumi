# ============================================================
# VERIFIKASI JARINGAN BESU IBFT 2.0
# Jalankan dari laptop mana saja setelah ketiga node aktif
# ============================================================

param(
    [string]$RPC = "http://localhost:8545"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " BHUMI BESU NETWORK - VERIFIKASI     " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Target RPC: $RPC`n" -ForegroundColor Yellow

$headers = @{ "Content-Type" = "application/json" }

function Invoke-RPC {
    param([string]$method, [array]$params = @())
    $body = @{ jsonrpc = "2.0"; method = $method; params = $params; id = 1 } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri $RPC -Method POST -Body $body -Headers $headers
        return $resp.result
    } catch {
        return $null
    }
}

# 1. Cek koneksi
Write-Host "[1] Cek Koneksi RPC..." -ForegroundColor Yellow
$clientVersion = Invoke-RPC "web3_clientVersion"
if ($clientVersion) {
    Write-Host "    ✅ Terhubung: $clientVersion" -ForegroundColor Green
} else {
    Write-Host "    ❌ GAGAL: Pastikan node Besu sudah berjalan!" -ForegroundColor Red
    exit 1
}

# 2. Cek Chain ID
Write-Host "`n[2] Cek Chain ID..." -ForegroundColor Yellow
$chainId = Invoke-RPC "eth_chainId"
$chainIdDec = [Convert]::ToInt64($chainId, 16)
Write-Host "    Chain ID: $chainIdDec (hex: $chainId)" -ForegroundColor White
if ($chainIdDec -eq 1337) {
    Write-Host "    ✅ Chain ID benar (1337)" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Chain ID tidak sesuai! Pastikan genesis.json chainId=1337" -ForegroundColor Red
}

# 3. Cek block number
Write-Host "`n[3] Cek Block Number..." -ForegroundColor Yellow
$blockHex = Invoke-RPC "eth_blockNumber"
$blockNum = [Convert]::ToInt64($blockHex, 16)
Write-Host "    Block terbaru: #$blockNum" -ForegroundColor White
if ($blockNum -gt 0) {
    Write-Host "    ✅ Block sedang diproduksi (IBFT 2.0 aktif)" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Block belum maju — pastikan minimal 2/3 validator online" -ForegroundColor Red
}

# 4. Cek jumlah peer
Write-Host "`n[4] Cek Peers..." -ForegroundColor Yellow
$peerHex = Invoke-RPC "net_peerCount"
$peerCount = [Convert]::ToInt64($peerHex, 16)
Write-Host "    Jumlah peer: $peerCount" -ForegroundColor White
if ($peerCount -ge 2) {
    Write-Host "    ✅ Semua 3 node terhubung!" -ForegroundColor Green
} elseif ($peerCount -eq 1) {
    Write-Host "    ⚠️  Hanya 2 dari 3 node yang terhubung" -ForegroundColor Yellow
} else {
    Write-Host "    ❌ Node ini isolated! Cek bootnodes dan firewall" -ForegroundColor Red
}

# 5. Cek IBFT Validators
Write-Host "`n[5] Cek IBFT Validators..." -ForegroundColor Yellow
$validators = Invoke-RPC "ibft_getValidatorsByBlockNumber" @("latest")
if ($validators) {
    Write-Host "    ✅ Validator aktif ($($validators.Count) node):" -ForegroundColor Green
    foreach ($v in $validators) {
        Write-Host "       - $v" -ForegroundColor White
    }
} else {
    Write-Host "    ❌ Tidak bisa query IBFT validators" -ForegroundColor Red
}

# 6. Cek enode URL
Write-Host "`n[6] Enode URL node ini..." -ForegroundColor Yellow
$enode = Invoke-RPC "net_enode"
Write-Host "    $enode" -ForegroundColor Cyan

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host " RINGKASAN:" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host " Chain ID  : $chainIdDec" -ForegroundColor White
Write-Host " Block     : #$blockNum" -ForegroundColor White
Write-Host " Peers     : $peerCount" -ForegroundColor White
Write-Host " RPC URL   : $RPC" -ForegroundColor White
Write-Host "`nJika semua ✅, jaringan Bhumi Besu IBFT 2.0 siap!" -ForegroundColor Green
