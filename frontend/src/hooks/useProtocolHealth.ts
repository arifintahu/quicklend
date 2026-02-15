'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts } from '@/lib/contracts';

export interface HealthFactorData {
  healthFactor: number;
  status: 'safe' | 'warning' | 'danger' | 'none';
}

export function useProtocolHealth() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: contracts.lendingPool.address,
    abi: contracts.lendingPool.abi,
    functionName: 'getUserHealthFactor',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contracts.lendingPool.address && !!address,
      refetchInterval: 5000, // More frequent for critical data
      staleTime: 3000,
    },
  });

  const healthFactor = data ? Number(formatUnits(data as bigint, 18)) : 0;

  let status: HealthFactorData['status'] = 'none';
  if (isConnected && data) {
    if (healthFactor >= 1.5) {
      status = 'safe';
    } else if (healthFactor >= 1.2) {
      status = 'warning';
    } else if (healthFactor > 0) {
      status = 'danger';
    }
  }

  return {
    healthFactor,
    status,
    isLoading,
    error,
    refetch,
    isConnected,
  };
}
