# ============================================================
# START ALL 3 NODES LOCALLY (FOR DEMO)
# ============================================================

$BASE = "C:\bhumi-besu"
$GENESIS = "$BASE\genesis.json"
$BESU = "C:\besu\bin\besu.bat"
$BOOTNODE = "enode://aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338@127.0.0.1:30303"

Write-Host "Starting Node 2..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoExit -Command & '$BESU' --data-path='$BASE\node2\data' --genesis-file='$GENESIS' --rpc-http-enabled=true --rpc-http-port=8546 --p2p-port=30304 --bootnodes='$BOOTNODE' --min-gas-price=0"

Write-Host "Starting Node 3..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoExit -Command & '$BESU' --data-path='$BASE\node3\data' --genesis-file='$GENESIS' --rpc-http-enabled=true --rpc-http-port=8547 --p2p-port=30305 --bootnodes='$BOOTNODE' --min-gas-price=0"

Write-Host "All nodes starting in separate windows. Wait for them to connect." -ForegroundColor Green
