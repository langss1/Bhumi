/**
 * Wagmi v2 + Viem configuration for BPN Land Registry
 *
 * ─── Konfigurasi RPC (Hyperledger Besu IBFT 2.0) ─────────────────────────────
 * Set NEXT_PUBLIC_RPC_URL di .env.local sesuai laptop:
 *
 *   Laptop 1 (BPN Pusat)    : NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
 *   Laptop 2 (BPN Wilayah A): NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
 *   Laptop 3 (BPN Wilayah B): NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
 *
 * Setiap laptop konek ke NODE LOKAL SENDIRI (localhost)!
 * Ini adalah inti dari decentralisasi — tiap laptop punya salinan blockchain.
 * Jika laptop dimatikan, laptop lain tetap punya data via node mereka sendiri.
 *
 * Fallback ke Laptop 1 ZeroTier jika tidak ada .env.local:
 *   NEXT_PUBLIC_RPC_URL_FALLBACK=http://10.223.153.80:8545
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Setiap laptop set ke localhost agar konek ke node Besu lokal sendiri.
// Fallback ke ZeroTier Laptop 1 jika tidak ada .env.local
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL_FALLBACK ||
  'http://127.0.0.1:8545';

// ─── Bhumi Besu IBFT 2.0 Network (Chain ID: 1337) ────────────────────────────
export const localIBFT = defineChain({
  id: 31337,
  name: 'Bhumi Besu Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Bhumi Explorer', url: RPC_URL.replace(':8545', ':4000') },
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

