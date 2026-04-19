/**
 * Wagmi v2 + Viem configuration for Bang Bang Protocol
 * Supports: Base Sepolia (preferred) + Ethereum Sepolia (fallback)
 *
 * Usage in layout.tsx:
 *   <WagmiProvider config={wagmiConfig}>
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   </WagmiProvider>
 */

import { createConfig, http } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID — get one free at https://cloud.walletconnect.com
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'bangbang-dev-placeholder';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    // MetaMask / Injected wallets (Rabby, etc.)
    injected(),
    // WalletConnect (mobile wallets)
    walletConnect({ projectId: WC_PROJECT_ID }),
  ],
  transports: {
    // Base Sepolia — primary testnet (cheaper gas, same EVM)
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
    ),
    // Ethereum Sepolia — fallback
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC || 'https://rpc.sepolia.org'
    ),
  },
  // Enable SSR — required for Next.js App Router
  ssr: true,
});

// Chain info helpers
export const SUPPORTED_CHAINS = [baseSepolia, sepolia];
export const PRIMARY_CHAIN = baseSepolia;

export const CHAIN_EXPLORER: Record<number, string> = {
  [baseSepolia.id]: 'https://sepolia.basescan.org',
  [sepolia.id]:     'https://sepolia.etherscan.io',
};

export function getTxUrl(chainId: number, txHash: string): string {
  const base = CHAIN_EXPLORER[chainId] || 'https://sepolia.basescan.org';
  return `${base}/tx/${txHash}`;
}

export function getAddressUrl(chainId: number, address: string): string {
  const base = CHAIN_EXPLORER[chainId] || 'https://sepolia.basescan.org';
  return `${base}/address/${address}`;
}
