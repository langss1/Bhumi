# ============================================================
# LAPTOP 3 (BPN WILAYAH B) - FULL NODE & VALIDATOR
# ============================================================

$BASE     = "C:\bhumi-besu"
$GENESIS  = "$BASE\genesis.json"

# Load Konfigurasi Jaringan
. "$PSScriptRoot\network_config.ps1"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " LAPTOP 3 - BPN WILAYAH B (NODE 3)    " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "My IP     : $IP_LAPTOP3" -ForegroundColor Yellow
Write-Host "RPC       : http://0.0.0.0:8545" -ForegroundColor Yellow
Write-Host "P2P       : 30303 (Bootnodes: Laptop 1 & 2)" -ForegroundColor Yellow
Write-Host "`nStarting node... (Jaringan akan sync otomatis)`n" -ForegroundColor Green

# Daftar bootnode untuk laptop 3 adalah laptop 1 & 2
$MY_BOOTNODES = "enode://$ENODE_1@$($IP_LAPTOP1):30303,enode://$ENODE_2@$($IP_LAPTOP2):30303"

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
  --bootnodes="$MY_BOOTNODES" `
  --min-gas-price=0 `
  --logging=INFO
