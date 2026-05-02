/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      'pino-pretty': 'pino-pretty',
      'lokijs': 'lokijs',
      'encoding': 'encoding',
      'accounts': 'accounts',
      '@safe-global/safe-apps-sdk': '@safe-global/safe-apps-sdk',
      '@safe-global/safe-apps-provider': '@safe-global/safe-apps-provider',
      '@walletconnect/ethereum-provider': '@walletconnect/ethereum-provider',
      'porto/internal': 'porto/internal',
      '@coinbase/wallet-sdk': '@coinbase/wallet-sdk',
      '@metamask/connect-evm': '@metamask/connect-evm',
      'porto': 'porto'
    });
    return config;
  },
};

export default nextConfig;
