/**
 * Wagmi v2 + Viem configuration for BPN Land Registry
 * Supports: Local IBFT 2.0 / Clique node
 */

import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const localIBFT = defineChain({
  id: 31337,
  name: 'BPN Local Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://10.223.153.80:8545'] },
    public: { http: ['http://10.223.153.80:8545'] },
  },
  blockExplorers: {
    default: { name: 'BPN Explorer', url: 'http://10.223.153.80:4000' },
  },
});

export const wagmiConfig = createConfig({
  chains: [localIBFT],
  connectors: [
    injected(),
  ],
  transports: {
    [localIBFT.id]: http('http://10.223.153.80:8545'),
  },
  ssr: true,
});

export const SUPPORTED_CHAINS = [localIBFT];
export const PRIMARY_CHAIN = localIBFT;

export function getTxUrl(chainId: number, txHash: string): string {
  return `http://10.223.153.80:4000/tx/${txHash}`;
}

export function getAddressUrl(chainId: number, address: string): string {
  return `http://10.223.153.80:4000/address/${address}`;
}

export const LAND_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

