#!/bin/bash
# ============================================================
# LAPTOP 3 (BPN WILAYAH B) - FULL NODE & VALIDATOR
# ============================================================

BASE_DIR="/home/habb/Kuliah/blockchain/Bhumi"
BESU_BIN="$BASE_DIR/besu-binary/bin/besu"

export JAVA_HOME="$BASE_DIR/jdk-17.0.11+9"
export PATH=$JAVA_HOME/bin:$PATH

GENESIS="$BASE_DIR/besu-network/genesis.json"
DATA_PATH="$BASE_DIR/besu-network/node3/data"

# Konfigurasi Jaringan (Mengikuti network_config.ps1)
IP_LAPTOP1="10.223.153.80"   # Gilang (Pusat)
IP_LAPTOP2="10.223.153.176"  # Arin (Wilayah A)
IP_LAPTOP3="10.223.153.30"   # Ihab (Wilayah B)

ENODE_1="aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338"
ENODE_2="6a03ce7f21fd3ddc2335fbde4fc75e12f5813607f0a7870ea6433cb70b6b8b5d3e29568e648eb7e4a189d807e42168326c4f846ed3b4edfe5002cbc64ca79655"

# Bootnodes untuk Laptop 3 adalah Laptop 1 & Laptop 2
MY_BOOTNODES="enode://$ENODE_1@$IP_LAPTOP1:30303,enode://$ENODE_2@$IP_LAPTOP2:30303"

echo -e "\e[36m=====================================\e[0m"
echo -e "\e[36m LAPTOP 3 - BPN WILAYAH B (NODE 3)    \e[0m"
echo -e "\e[36m=====================================\e[0m"
echo -e "\e[33mMy IP     : $IP_LAPTOP3\e[0m"
echo -e "\e[33mRPC       : http://0.0.0.0:8545\e[0m"
echo -e "\e[33mP2P       : 30303 (Bootnodes: Laptop 1 & 2)\e[0m"
echo -e ""
echo -e "\e[32mStarting node... (Jaringan akan sync otomatis)\e[0m"
echo -e ""

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
  --bootnodes="$MY_BOOTNODES" \
  --min-gas-price=0 \
  --logging=INFO
