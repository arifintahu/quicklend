import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryPage from '../history/page';
import * as useTransactionHistoryModule from '@/hooks/useTransactionHistory';

vi.mock('@/hooks/useTransactionHistory');

vi.mock('@/components/organisms/Sidebar', () => ({
    Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));
vi.mock('@/components/organisms/Navbar', () => ({
    Navbar: () => <header data-testid="navbar">Navbar</header>,
}));

describe('History Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner when loading', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [],
            pagination: { page: 1, limit: 20 },
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        // Should show loader (Loader2 svg is rendered)
        const loader = document.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('shows empty state when no transactions', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        expect(screen.getByText('No transactions yet')).toBeInTheDocument();
        expect(screen.getByText('Your transaction history will appear here')).toBeInTheDocument();
    });

    it('renders transaction rows', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111111111111111111111111111111111111111',
                    amount: '1000000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
                {
                    txHash: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4',
                    blockNumber: '200',
                    eventName: 'Borrow',
                    asset: '0x2222222222222222222222222222222222222222',
                    amount: '500000',
                    timestamp: '2026-01-02T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        expect(screen.getByText('Supply')).toBeInTheDocument();
        expect(screen.getByText('Borrow')).toBeInTheDocument();
        expect(screen.getByText('1000000')).toBeInTheDocument();
        expect(screen.getByText('500000')).toBeInTheDocument();
    });

    it('displays Confirmed status badge', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111111111111111111111111111111111111111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('shortens tx hash display', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111111111111111111111111111111111111111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        // Hash should be shortened: 0xabc1...abc1
        expect(screen.getByText('0xabc1...abc1')).toBeInTheDocument();
    });

    it('renders table headers', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Asset')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Time')).toBeInTheDocument();
        expect(screen.getByText('Tx Hash')).toBeInTheDocument();
    });

    it('shows pagination controls with transactions', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    it('disables Previous button on page 1', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        const prevButton = screen.getByText('Previous').closest('button');
        expect(prevButton).toBeDisabled();
    });

    it('applies correct color classes for Supply action', () => {
        vi.spyOn(useTransactionHistoryModule, 'useTransactionHistory').mockReturnValue({
            history: [
                {
                    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
                    blockNumber: '100',
                    eventName: 'Supply',
                    asset: '0x1111',
                    amount: '1000',
                    timestamp: '2026-01-01T00:00:00Z',
                },
            ],
            pagination: { page: 1, limit: 20 },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(<HistoryPage />);

        const supplyCell = screen.getByText('Supply');
        expect(supplyCell.className).toContain('text-[#42e695]');
    });
});
