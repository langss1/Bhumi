'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';

// Create a single QueryClient instance for the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        30_000, // 30s before re-fetching on-chain data
      gcTime:           300_000, // 5min cache
      retry:            2,
      refetchOnWindowFocus: false,
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
