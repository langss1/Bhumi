import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Web3Provider } from '@/components/Web3Provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bhumi | Sistem Informasi Pertanahan Terdesentralisasi',
  description: 'Digitalisasi dan tokenisasi aset tanah serta sertifikat secara aman melalui blockchain.',
  keywords: ['RWA', 'blockchain', 'real world assets', 'Land Registry', 'BPN'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50`}>
        {/* Web3Provider: WagmiProvider + QueryClientProvider */}
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
