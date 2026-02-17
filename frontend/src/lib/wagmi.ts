'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { type Chain, mainnet, sepolia, anvil } from 'wagmi/chains';

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || 'Anvil';
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
const currencyName = process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || 'Ether';
const currencySymbol = process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || 'ETH';
const blockExplorerUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || '';

const localChain: Chain = {
  ...anvil,
  id: chainId,
  name: chainName,
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  nativeCurrency: {
    name: currencyName,
    symbol: currencySymbol,
    decimals: 18,
  },
  ...(blockExplorerUrl
    ? { blockExplorers: { default: { name: chainName, url: blockExplorerUrl } } }
    : {}),
};

export const wagmiConfig = getDefaultConfig({
  appName: 'QuickLend',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'd419fa909b9a2764bfa119296674f667',
  chains: [localChain, sepolia, mainnet],
  ssr: true,
});
