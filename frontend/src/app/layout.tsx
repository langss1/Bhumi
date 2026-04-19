import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { Web3Provider } from '@/components/Web3Provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bang Bang | Decentralized Physical Asset Management',
  description: 'Catat, validasi, dan kelola aset fisik Anda secara on-chain. RWA Protocol pada Base Sepolia.',
  keywords: ['RWA', 'blockchain', 'real world assets', 'Base Sepolia', 'DeFi'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Web3Provider: WagmiProvider + QueryClientProvider */}
        <Web3Provider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
