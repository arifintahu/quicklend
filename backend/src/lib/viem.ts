import { createPublicClient, http } from 'viem';
import { anvil, sepolia, mainnet } from 'viem/chains';
import { config } from '../config/index.js';

const chainMap = {
    31337: anvil,
    11155111: sepolia,
    1: mainnet,
} as const;

const chain = chainMap[config.chainId as keyof typeof chainMap] || anvil;

export const publicClient = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
});

export { config };
