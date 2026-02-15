'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { fetchHistory, type TransactionEvent } from '@/lib/api';

export function useTransactionHistory(page: number = 1, limit: number = 20) {
    const { address } = useAccount();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['transaction-history', address, page, limit],
        queryFn: () => fetchHistory(address!, page, limit),
        enabled: !!address,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    return {
        history: data?.data ?? [],
        pagination: data?.pagination ?? { page, limit },
        isLoading,
        error,
        refetch,
    };
}
