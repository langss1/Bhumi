import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // ─── Konfigurasi Node ─────────────────────────────────────────────────────
  networks: {
    hardhat: {
      chainId: 31337,
      blockGasLimit: 100000000,
      gas: 100000000,
      initialBaseFeePerGas: 0,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // ─── Hyperledger Besu IBFT 2.0 (PRODUKSI DEMO) ──────────────────────────
    // Jalankan besu-network/3_start_node1_LAPTOP1.ps1 terlebih dahulu
    // Ganti PRIVATE_KEY_DEPLOYER_ANDA dengan private key MetaMask yang ada
    // di alloc genesis.json
    besu: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 1000000000,
      accounts: [
        // Hardhat Test Account #0 — sudah pre-funded di genesis.json oleh 0_SETUP_LAPTOP1.ps1
        // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        // Tambahkan akun ini ke MetaMask untuk demo (import private key)
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    },

    // ─── ZeroTier Hardhat Lama (Fallback / Testing) ──────────────────────────
    zerotier: {
      url: "http://10.223.153.80:8545",
      chainId: 31337,
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    },

    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: ["0xeca04226022b29771e10f2e8ca55a6e720a6d3509e878a47e617b1475c19eff9"]
    },
  }
};
