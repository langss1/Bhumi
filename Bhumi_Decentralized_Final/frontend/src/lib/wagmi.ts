import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://10.223.153.80:8545';

export const localIBFT = defineChain({
  id: 31337,
  name: 'Bhumi Besu Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
});

export const wagmiConfig = createConfig({
  chains: [localIBFT],
  connectors: [injected()],
  transports: {
    [localIBFT.id]: http(RPC_URL),
  },
  ssr: true,
});

export const LAND_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
