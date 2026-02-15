import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWalletBalance } from '../useWalletBalance';
import { useAccount, useReadContract } from 'wagmi';

vi.mock('wagmi', () => ({
    useAccount: vi.fn(),
    useReadContract: vi.fn(),
}));

describe('useWalletBalance', () => {
    const mockUseAccount = vi.mocked(useAccount);
    const mockUseReadContract = vi.mocked(useReadContract);

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAccount.mockReturnValue({
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            isConnected: true,
        } as ReturnType<typeof useAccount>);
    });

    it('returns 0 balance when no data', () => {
        mockUseReadContract.mockReturnValue({
            data: undefined,
            isLoading: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReadContract>);

        const { result } = renderHook(() =>
            useWalletBalance('0x1111111111111111111111111111111111111111')
        );

        expect(result.current.balance).toBe(0);
    });

    it('formats balance with correct decimals (18)', () => {
        // 1.5 ETH = 1500000000000000000n
        mockUseReadContract.mockReturnValue({
            data: BigInt('1500000000000000000'),
            isLoading: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReadContract>);

        const { result } = renderHook(() =>
            useWalletBalance('0x2222222222222222222222222222222222222222', 18)
        );

        expect(result.current.balance).toBe(1.5);
    });

    it('formats balance with correct decimals (6 for USDC)', () => {
        // 1000 USDC = 1000000000n (6 decimals)
        mockUseReadContract.mockReturnValue({
            data: BigInt('1000000000'),
            isLoading: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReadContract>);

        const { result } = renderHook(() =>
            useWalletBalance('0x1111111111111111111111111111111111111111', 6)
        );

        expect(result.current.balance).toBe(1000);
    });

    it('returns loading state', () => {
        mockUseReadContract.mockReturnValue({
            data: undefined,
            isLoading: true,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReadContract>);

        const { result } = renderHook(() =>
            useWalletBalance('0x1111111111111111111111111111111111111111')
        );

        expect(result.current.isLoading).toBe(true);
    });

    it('returns 0 when token address is undefined', () => {
        mockUseReadContract.mockReturnValue({
            data: undefined,
            isLoading: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useReadContract>);

        const { result } = renderHook(() =>
            useWalletBalance(undefined)
        );

        expect(result.current.balance).toBe(0);
    });
});
