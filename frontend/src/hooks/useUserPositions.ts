'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts } from '@/lib/contracts';

export interface UserPosition {
  asset: `0x${string}`;
  symbol: string;
  suppliedAmount: number;
  borrowedAmount: number;
  isCollateral: boolean;
}

interface RawUserPosition {
  asset: `0x${string}`;
  symbol: string;
  suppliedBalance: bigint;
  borrowedBalance: bigint;
  isCollateral: boolean;
}

export function useUserPositions() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.uiDataProvider.address,
    abi: contracts.uiDataProvider.abi,
    functionName: 'getUserData',
    args: contracts.lendingPool.address && address
      ? [contracts.lendingPool.address, address]
      : undefined,
    query: {
      enabled: !!contracts.uiDataProvider.address && !!contracts.lendingPool.address && !!address,
      refetchInterval: 15000,
      staleTime: 10000,
    },
  });

  // We need decimals from markets to properly format - for now assume 18
  // In production, you'd cross-reference with useMarkets
  const positions: UserPosition[] = data
    ? (data as RawUserPosition[])
      .filter((p) => p.suppliedBalance > 0n || p.borrowedBalance > 0n)
      .map((position) => ({
        asset: position.asset,
        symbol: position.symbol,
        suppliedAmount: Number(formatUnits(position.suppliedBalance, 18)), // TODO: Get actual decimals
        borrowedAmount: Number(formatUnits(position.borrowedBalance, 18)),
        isCollateral: position.isCollateral,
      }))
    : [];

  return {
    positions,
    isLoading,
    error,
    refetch,
    isConnected,
    address,
  };
}
