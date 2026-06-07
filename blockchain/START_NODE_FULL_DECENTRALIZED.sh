#!/bin/bash

# ============================================================
# BHUMI - ALL-IN-ONE START SCRIPT (DECENTRALIZED - LINUX)
# Jalankan script ini untuk menyalakan Node + Sync Storage
# ============================================================

# Mengambil absolute path dari direktori skrip ini dijalankan
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "Siapa yang menjalankan node ini?"
echo "1. Gilang (Laptop 1)"
echo "2. Arin (Laptop 2)"
echo "3. Ihab (Laptop 3)"
read -p "Pilih (1/2/3): " CHOICE

if [ "$CHOICE" == "1" ]; then
    NODE_NAME="LAPTOP 1 - BPN PUSAT (NODE 1)"
    DATA_DIR="node1"
    BOOTNODES="enode://6a03ce7f21fd3ddc2335fbde4fc75e12f5813607f0a7870ea6433cb70b6b8b5d3e29568e648eb7e4a189d807e42168326c4f846ed3b4edfe5002cbc64ca79655@10.223.153.176:30303,enode://f6c74bd81d47e9ddd49ddc11329860be6bfb64cf4a43c9eae3d4b81c08e83154822d110586f08f61d9f26235d0983d9da3af7f0677acfd31467d056cad87e0d2@10.223.153.30:30303"
    MY_IP="10.223.153.80"
elif [ "$CHOICE" == "2" ]; then
    NODE_NAME="LAPTOP 2 - BPN WILAYAH A (NODE 2)"
    DATA_DIR="node2"
    BOOTNODES="enode://aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338@10.223.153.80:30303,enode://f6c74bd81d47e9ddd49ddc11329860be6bfb64cf4a43c9eae3d4b81c08e83154822d110586f08f61d9f26235d0983d9da3af7f0677acfd31467d056cad87e0d2@10.223.153.30:30303"
    MY_IP="10.223.153.176"
elif [ "$CHOICE" == "3" ]; then
    NODE_NAME="LAPTOP 3 - BPN WILAYAH B (NODE 3)"
    DATA_DIR="node3"
    BOOTNODES="enode://aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338@10.223.153.80:30303,enode://6a03ce7f21fd3ddc2335fbde4fc75e12f5813607f0a7870ea6433cb70b6b8b5d3e29568e648eb7e4a189d807e42168326c4f846ed3b4edfe5002cbc64ca79655@10.223.153.176:30303"
    MY_IP="10.223.153.30"
else
    echo "Pilihan tidak valid."
    exit 1
fi

echo -e "\e[36m=====================================\e[0m"
echo -e "\e[36m $NODE_NAME\e[0m"
echo -e "\e[36m=====================================\e[0m"
echo -e "\e[33mMy IP     : $MY_IP\e[0m"
echo -e "\e[33mRPC       : http://0.0.0.0:8545\e[0m"
echo -e "\e[33mP2P       : 30303\e[0m"
echo -e ""

# 2. Setup Java & Paths
BESU_BIN="$BASE_DIR/besu-binary/bin/besu"
export JAVA_HOME="$BASE_DIR/jdk-17.0.11+9"
export PATH=$JAVA_HOME/bin:$PATH

GENESIS="$SCRIPT_DIR/genesis.json"
DATA_PATH="$SCRIPT_DIR/$DATA_DIR/data"

# Fungsi Clean Up saat Ctrl+C
cleanup() {
    echo -e "\n\e[31m[System] Menghentikan semua proses...\e[0m"
    kill $BESU_PID 2>/dev/null
    kill $SYNC_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT

# 3. Jalankan Besu Node
echo -e "\e[36m[1/2] Menyalakan Jaringan Blockchain (Besu)...\e[0m"
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
  --bootnodes="$BOOTNODES" \
  --min-gas-price=0 \
  --logging=INFO > "$BASE_DIR/besu.log" 2>&1 &

BESU_PID=$!
echo -e "\e[32mBesu berjalan di background dengan PID $BESU_PID (Log disimpan di besu.log)\e[0m"

# 4. Tunggu RPC ready
echo -e "\e[33mMenunggu RPC (127.0.0.1:8545) siap...\e[0m"
for i in {1..30}; do
    if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":67}' http://127.0.0.1:8545 > /dev/null; then
        echo -e "\e[32mRPC siap!\e[0m"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 5. Jalankan Storage Sync
echo -e "\e[36m[2/2] Menyalakan Sinkronisasi Storage Lokal (Bhumi-Sync)...\e[0m"
cd "$SCRIPT_DIR"
node bhumi-storage-sync.js > "$BASE_DIR/sync.log" 2>&1 &
SYNC_PID=$!
echo -e "\e[32mBhumi-Sync berjalan di background dengan PID $SYNC_PID (Log disimpan di sync.log)\e[0m"

STORAGE_PATH_DISPLAY="$HOME/bhumi-data/storage"

echo -e "\e[32m====================================================\e[0m"
echo -e "\e[32m BERHASIL! Node dan Storage sedang berjalan.\e[0m"
echo -e "\e[33m Folder Penyimpanan: $STORAGE_PATH_DISPLAY\e[0m"
echo -e "\e[33m Gunakan Ctrl+C untuk menghentikan kedua proses.\e[0m"
echo -e "\e[32m====================================================\e[0m"

# Tampilkan log Sync secara real-time
echo -e "\e[36mMenampilkan log sinkronisasi (sync.log) secara langsung...\e[0m"
tail -f "$BASE_DIR/sync.log"
