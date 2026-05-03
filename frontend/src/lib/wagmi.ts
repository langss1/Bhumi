/**
 * Wagmi v2 + Viem configuration for BPN Land Registry
 *
 * ─── Konfigurasi RPC ──────────────────────────────────────────────────────────
 * Set NEXT_PUBLIC_RPC_URL di .env.local sesuai kondisi:
 *
 *   Mode Testing Lokal  : NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
 *   Mode Presentasi LAN : NEXT_PUBLIC_RPC_URL=http://10.223.153.80:8545
 *
 * Default: http://127.0.0.1:8545 (localhost Hardhat)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Ambil RPC URL dari env atau default ke localhost
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

export const localIBFT = defineChain({
  id: 31337,
  name: 'BPN Local Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'BPN Explorer', url: RPC_URL.replace(':8545', ':4000') },
  },
});

export const wagmiConfig = createConfig({
  chains: [localIBFT],
  connectors: [
    injected(),
  ],
  transports: {
    [localIBFT.id]: http(RPC_URL),
  },
  ssr: true,
});

export const SUPPORTED_CHAINS = [localIBFT];
export const PRIMARY_CHAIN = localIBFT;

export function getTxUrl(chainId: number, txHash: string): string {
  return `${RPC_URL.replace(':8545', ':4000')}/tx/${txHash}`;
}

export function getAddressUrl(chainId: number, address: string): string {
  return `${RPC_URL.replace(':8545', ':4000')}/address/${address}`;
}

export const LAND_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

