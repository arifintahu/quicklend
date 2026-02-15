'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts } from '@/lib/contracts';

export interface MarketData {
  asset: `0x${string}`;
  symbol: string;
  decimals: number;
  ltv: number;
  liquidationThreshold: number;
  supplyAPY: number;
  borrowAPY: number;
  totalSupplied: number;
  totalBorrowed: number;
  availableLiquidity: number;
  price: number;
}

interface RawMarketData {
  asset: `0x${string}`;
  symbol: string;
  decimals: number;
  ltv: bigint;
  liqThreshold: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  availableLiquidity: bigint;
  priceUsd: bigint;
}

export function useMarkets() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.uiDataProvider.address,
    abi: contracts.uiDataProvider.abi,
    functionName: 'getMarketData',
    args: contracts.lendingPool.address ? [contracts.lendingPool.address] : undefined,
    query: {
      enabled: !!contracts.uiDataProvider.address && !!contracts.lendingPool.address,
      refetchInterval: 15000, // Refetch every 15 seconds
      staleTime: 10000,
    },
  });

  // Transform raw contract data to UI-friendly format
  const markets: MarketData[] = data
    ? (data as RawMarketData[]).map((market) => ({
      asset: market.asset,
      symbol: market.symbol,
      decimals: market.decimals,
      ltv: Number(formatUnits(market.ltv, 18)),
      liquidationThreshold: Number(formatUnits(market.liqThreshold, 18)),
      supplyAPY: Number(formatUnits(market.supplyRate, 18)),
      borrowAPY: Number(formatUnits(market.borrowRate, 18)),
      totalSupplied: Number(formatUnits(market.totalSupplied, market.decimals)),
      totalBorrowed: Number(formatUnits(market.totalBorrowed, market.decimals)),
      availableLiquidity: Number(formatUnits(market.availableLiquidity, market.decimals)),
      price: Number(formatUnits(market.priceUsd, 18)),
    }))
    : [];

  return {
    markets,
    isLoading,
    error,
    refetch,
    isConfigured: !!contracts.uiDataProvider.address && !!contracts.lendingPool.address,
  };
}
