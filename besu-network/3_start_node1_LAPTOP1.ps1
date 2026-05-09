# ============================================================
# LAPTOP 1 (BPN PUSAT) - BOOTNODE & VALIDATOR UTAMA
# Jalankan script ini di Laptop 1
# ============================================================

$BASE    = "C:\bhumi-besu"
$GENESIS = "$BASE\genesis.json"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LAPTOP 1 - BPN PUSAT (BOOTNODE)     " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "RPC  : http://0.0.0.0:8545" -ForegroundColor Yellow
Write-Host "P2P  : 0.0.0.0:30303" -ForegroundColor Yellow
Write-Host "`nStarting node... (Ctrl+C untuk stop)`n" -ForegroundColor Green

& "C:\besu\bin\besu.bat" `
  --data-path="$BASE\node1\data" `
  --genesis-file="$GENESIS" `
  --rpc-http-enabled=true `
  --rpc-http-api=ETH,NET,IBFT,ADMIN,DEBUG,WEB3 `
  --rpc-http-host=0.0.0.0 `
  --rpc-http-port=8545 `
  --rpc-http-cors-origins="*" `
  --host-allowlist="*" `
  --rpc-ws-enabled=true `
  --rpc-ws-host=0.0.0.0 `
  --rpc-ws-port=8646 `
  --p2p-host=0.0.0.0 `
  --p2p-port=30303 `
  --nat-method=NONE `
  --min-gas-price=0 `
  --logging=INFO
