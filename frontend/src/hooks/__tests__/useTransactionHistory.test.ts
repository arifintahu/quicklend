import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactionHistory } from '../useTransactionHistory';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
    };
});

vi.mock('wagmi', () => ({
    useAccount: vi.fn(),
}));

describe('useTransactionHistory', () => {
    const mockUseQuery = vi.mocked(useQuery);
    const mockUseAccount = vi.mocked(useAccount);

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAccount.mockReturnValue({
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            isConnected: true,
        } as ReturnType<typeof useAccount>);
    });

    it('returns empty history when loading', () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        const { result } = renderHook(() => useTransactionHistory());

        expect(result.current.history).toEqual([]);
        expect(result.current.isLoading).toBe(true);
    });

    it('returns history data when loaded', () => {
        const mockData = {
            success: true,
            data: [
                {
                    txHash: '0xabc',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111',
                    amount: '1000000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
        };

        mockUseQuery.mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        const { result } = renderHook(() => useTransactionHistory());

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].eventName).toBe('Supply');
        expect(result.current.isLoading).toBe(false);
    });

    it('returns default pagination when no data', () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        const { result } = renderHook(() => useTransactionHistory(2, 50));

        expect(result.current.pagination).toEqual({ page: 2, limit: 50 });
    });

    it('passes correct query key with page and limit', () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        renderHook(() => useTransactionHistory(3, 10));

        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['transaction-history', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 3, 10],
                enabled: true,
            })
        );
    });

    it('disables query when no wallet connected', () => {
        mockUseAccount.mockReturnValue({
            address: undefined,
            isConnected: false,
        } as ReturnType<typeof useAccount>);

        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        renderHook(() => useTransactionHistory());

        expect(mockUseQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
            })
        );
    });

    it('exposes error state', () => {
        const mockError = new Error('Network error');
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: mockError,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQuery>);

        const { result } = renderHook(() => useTransactionHistory());

        expect(result.current.error).toBe(mockError);
    });
});
