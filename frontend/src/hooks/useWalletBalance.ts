'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/lib/contracts';

export function useWalletBalance(
  tokenAddress: `0x${string}` | undefined,
  decimals: number = 18
) {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
      refetchInterval: 15000,
    },
  });

  const balance = data ? Number(formatUnits(data as bigint, decimals)) : 0;

  return { balance, isLoading, refetch };
}
