'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts } from '@/lib/contracts';
import { useMarkets } from './useMarkets';

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
  const { markets } = useMarkets();

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

  // Build a decimals lookup from market data
  const decimalsMap = new Map(markets.map((m) => [m.asset.toLowerCase(), m.decimals]));

  const positions: UserPosition[] = data
    ? (data as RawUserPosition[])
      .filter((p) => p.suppliedBalance > BigInt(0) || p.borrowedBalance > BigInt(0))
      .map((position) => {
        const decimals = decimalsMap.get(position.asset.toLowerCase()) ?? 18;
        return {
          asset: position.asset,
          symbol: position.symbol,
          suppliedAmount: Number(formatUnits(position.suppliedBalance, decimals)),
          borrowedAmount: Number(formatUnits(position.borrowedBalance, decimals)),
          isCollateral: position.isCollateral,
        };
      })
    : [];

  return {
    positions,
    userPositions: positions,
    isLoading,
    error,
    refetch,
    isConnected,
    address,
  };
}
