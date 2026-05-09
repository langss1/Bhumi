# ============================================================
# LAPTOP 3 (BPN WILAYAH B) - VALIDATOR NODE 3
# Copy folder node3 dari Laptop 1 ke C:\bhumi-besu\node3
# Copy genesis.json ke C:\bhumi-besu\genesis.json
# GANTI ENODE_LAPTOP1 dengan enode:// dari Laptop 1!
# ============================================================

$BASE     = "C:\bhumi-besu"
$GENESIS  = "$BASE\genesis.json"

# !! GANTI INI dengan enode:// dari output Laptop 1 !!
$BOOTNODE = "enode://aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338@10.223.153.80:30303"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LAPTOP 3 - BPN WILAYAH B (VALIDATOR) " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Bootnode : $BOOTNODE" -ForegroundColor Yellow
Write-Host "RPC      : http://0.0.0.0:8545" -ForegroundColor Yellow
Write-Host "P2P      : 0.0.0.0:30303" -ForegroundColor Yellow
Write-Host "`nStarting node... (Ctrl+C untuk stop)`n" -ForegroundColor Green

& "C:\besu\bin\besu.bat" `
  --data-path="$BASE\node3\data" `
  --genesis-file="$GENESIS" `
  --rpc-http-enabled=true `
  --rpc-http-api=ETH,NET,IBFT,ADMIN,DEBUG,WEB3 `
  --rpc-http-host=0.0.0.0 `
  --rpc-http-port=8545 `
  --rpc-http-cors-origins="*" `
  --host-allowlist="*" `
  --rpc-ws-enabled=true `
  --rpc-ws-host=0.0.0.0 `
  --rpc-ws-port=8546 `
  --p2p-host=0.0.0.0 `
  --p2p-port=30303 `
  --nat-method=NONE `
  --bootnodes="$BOOTNODE" `
  --logging=INFO
