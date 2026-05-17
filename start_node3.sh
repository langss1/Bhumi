#!/bin/bash
# Node 3 - Ihab (Auditor) - Linux

BASE_DIR="/home/habb/Kuliah/blockchain/Bhumi"
BESU_BIN="$BASE_DIR/besu-binary/bin/besu"

export JAVA_HOME="$BASE_DIR/jdk-17.0.11+9"
export PATH=$JAVA_HOME/bin:$PATH

GENESIS="$BASE_DIR/besu-network/genesis.json"
DATA_PATH="$BASE_DIR/besu-network/node3/data"

# Bootnode = Gilang (Laptop 1)
BOOTNODE="enode://aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338@10.223.153.80:30303"

echo "====================================="
echo " LAPTOP 3 - IHAB (AUDITOR/NODE 3)"
echo "====================================="
echo "Bootnode : $BOOTNODE"
echo "RPC      : http://0.0.0.0:8545"
echo "P2P      : 0.0.0.0:30303"
echo "Starting node... (Ctrl+C to stop)"
echo ""

"$BESU_BIN" \
  --data-path="$DATA_PATH" \
  --genesis-file="$GENESIS" \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,IBFT,ADMIN,DEBUG,WEB3 \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --rpc-http-cors-origins="*" \
  --host-allowlist="*" \
  --rpc-ws-enabled=true \
  --rpc-ws-host=0.0.0.0 \
  --rpc-ws-port=8546 \
  --p2p-host=0.0.0.0 \
  --p2p-port=30303 \
  --nat-method=NONE \
  --min-gas-price=0 \
  --bootnodes="$BOOTNODE" \
  --logging=INFO
