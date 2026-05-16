import { createConfig, http, fallback } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Mengambil URL dari .env.local (jika ada) sebagai prioritas utama
const ENV_RPC = process.env.NEXT_PUBLIC_RPC_URL;

// Daftar semua node di jaringan Bhumi ZeroTier
const NODE1_GILANG = 'http://10.223.153.80:8545';
const NODE2_ARIN   = 'http://10.223.153.176:8545';
const NODE3_IHAB   = 'http://10.223.153.30:8545';

// Membuat array dari transport http()
const rpcList = [];
if (ENV_RPC) rpcList.push(http(ENV_RPC));

// Tambahkan daftar fallback jika URL utama mati
rpcList.push(http(NODE2_ARIN));
rpcList.push(http(NODE1_GILANG));
rpcList.push(http(NODE3_IHAB));

export const localIBFT = defineChain({
  id: 31337,
  name: 'Bhumi Besu Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [ENV_RPC || NODE2_ARIN, NODE1_GILANG, NODE3_IHAB] },
    public: { http: [ENV_RPC || NODE2_ARIN, NODE1_GILANG, NODE3_IHAB] },
  },
});

export const wagmiConfig = createConfig({
  chains: [localIBFT],
  connectors: [injected()],
  transports: {
    // Menggunakan fitur fallback() agar otomatis pindah koneksi jika gagal
    [localIBFT.id]: fallback(rpcList),
  },
  ssr: true,
});

export const LAND_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;
