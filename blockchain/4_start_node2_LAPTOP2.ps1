# ============================================================
# LAPTOP 2 (BPN WILAYAH A) - FULL NODE & VALIDATOR
# ============================================================

$BASE     = "C:\bhumi-besu"
$GENESIS  = "$BASE\genesis.json"

# Load Konfigurasi Jaringan
. "$PSScriptRoot\network_config.ps1"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LAPTOP 2 - BPN WILAYAH A (NODE 2)    " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "My IP     : $IP_LAPTOP2" -ForegroundColor Yellow
Write-Host "RPC       : http://0.0.0.0:8545" -ForegroundColor Yellow
Write-Host "P2P       : 30303 (Bootnodes: Laptop 1 & 3)" -ForegroundColor Yellow
Write-Host "`nStarting node... (Jaringan akan sync otomatis)`n" -ForegroundColor Green

# Daftar bootnode untuk laptop 2 adalah laptop 1 & 3
$MY_BOOTNODES = "enode://$ENODE_1@$($IP_LAPTOP1):30303,enode://$ENODE_3@$($IP_LAPTOP3):30303"

& "C:\besu\bin\besu.bat" `
  --data-path="$BASE\node2\data" `
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
  --bootnodes="$MY_BOOTNODES" `
  --min-gas-price=0 `
  --logging=INFO
