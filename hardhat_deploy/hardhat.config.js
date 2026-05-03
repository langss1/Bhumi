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

  // ─── Konfigurasi Node Lokal ────────────────────────────────────────────────
  // PENTING: hostname 0.0.0.0 agar node bisa diakses dari laptop lain
  // via ZeroTier. Tanpa ini, node hanya bisa diakses dari localhost sendiri.
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // ─── ZeroTier P2P Network (Presentasi Multi-Laptop) ─────────────────────
    // Digunakan oleh Laptop 1 (BPN Pusat) saat deploy ke node yang sudah berjalan
    // Jalankan node dengan: npx hardhat node --hostname 0.0.0.0
    zerotier: {
      url: "http://10.223.153.80:8545",
      chainId: 31337,
      accounts: [
        // Account #0 - BPN Pusat / Deployer
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: ["0xeca04226022b29771e10f2e8ca55a6e720a6d3509e878a47e617b1475c19eff9"]
    },
  }
};
