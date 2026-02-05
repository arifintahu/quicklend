'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, anvil } from 'wagmi/chains';

// Use Anvil for local development
const localAnvil = {
  ...anvil,
  id: 31337,
  name: 'Anvil',
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
};

export const wagmiConfig = getDefaultConfig({
  appName: 'QuickLend',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'd419fa909b9a2764bfa119296674f667',
  chains: [localAnvil, sepolia, mainnet],
  ssr: true, // Enable SSR for Next.js
});
