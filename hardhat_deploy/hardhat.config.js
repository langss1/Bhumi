import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20", // Use the version from foundry
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: ["0xeca04226022b29771e10f2e8ca55a6e720a6d3509e878a47e617b1475c19eff9"]
    },
    bpn_local: {
      url: "http://192.168.1.5:8545",
      chainId: 1337,
      // Default hardhat account 0 private key for local testing. In reality, the student node operator provides this.
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
    }
  }
};
