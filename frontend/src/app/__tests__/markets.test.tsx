import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketsPage from '../markets/page';
import * as useMarketsModule from '@/hooks/useMarkets';
import * as useUserPositionsModule from '@/hooks/useUserPositions';

vi.mock('@/hooks/useMarkets');
vi.mock('@/hooks/useUserPositions');

vi.mock('@/components/organisms/Sidebar', () => ({
    Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));
vi.mock('@/components/organisms/Navbar', () => ({
    Navbar: () => <header data-testid="navbar">Navbar</header>,
}));
vi.mock('@/components/organisms/AssetTable', () => ({
    AssetTable: ({ markets }: { markets: unknown[] }) => (
        <table data-testid="asset-table">
            <tbody>
                <tr><td>{markets.length} markets</td></tr>
            </tbody>
        </table>
    ),
}));

const mockMarkets: useMarketsModule.MarketData[] = [
    {
        asset: '0x1111',
        symbol: 'USDC',
        decimals: 6,
        ltv: 0.8,
        liquidationThreshold: 0.85,
        supplyAPY: 0.03,
        borrowAPY: 0.05,
        totalSupplied: 1_000_000,
        totalBorrowed: 500_000,
        availableLiquidity: 500_000,
        price: 1,
    },
    {
        asset: '0x2222',
        symbol: 'WETH',
        decimals: 18,
        ltv: 0.75,
        liquidationThreshold: 0.8,
        supplyAPY: 0.02,
        borrowAPY: 0.04,
        totalSupplied: 10_000,
        totalBorrowed: 5_000,
        availableLiquidity: 5_000,
        price: 2500,
    },
];

describe('Markets Page', () => {
    beforeEach(() => {
        vi.spyOn(useMarketsModule, 'useMarkets').mockReturnValue({
            markets: mockMarkets,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            isConfigured: true,
        });
        vi.spyOn(useUserPositionsModule, 'useUserPositions').mockReturnValue({
            positions: [],
            userPositions: [],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            isConnected: true,
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        });
    });

    it('renders market stats', () => {
        render(<MarketsPage />);

        expect(screen.getByText('Total Market Size')).toBeInTheDocument();
        expect(screen.getByText('Total Available')).toBeInTheDocument();
        expect(screen.getByText('Total Borrows')).toBeInTheDocument();
    });

    it('calculates total market size correctly', () => {
        render(<MarketsPage />);

        // USDC: 1M * $1 = $1M, WETH: 10K * $2500 = $25M -> Total = $26M
        expect(screen.getByText('$26,000,000.00')).toBeInTheDocument();
    });

    it('renders search input', () => {
        render(<MarketsPage />);

        const searchInput = screen.getByPlaceholderText('Search assets...');
        expect(searchInput).toBeInTheDocument();
    });

    it('filters markets by search term', () => {
        render(<MarketsPage />);

        const searchInput = screen.getByPlaceholderText('Search assets...');
        fireEvent.change(searchInput, { target: { value: 'WETH' } });

        // Should show only 1 market (WETH)
        expect(screen.getByText('1 markets')).toBeInTheDocument();
    });

    it('shows all markets when search is empty', () => {
        render(<MarketsPage />);

        expect(screen.getByText('2 markets')).toBeInTheDocument();
    });

    it('shows 0 markets for non-matching search', () => {
        render(<MarketsPage />);

        const searchInput = screen.getByPlaceholderText('Search assets...');
        fireEvent.change(searchInput, { target: { value: 'XYZ' } });

        expect(screen.getByText('0 markets')).toBeInTheDocument();
    });

    it('renders the asset table', () => {
        render(<MarketsPage />);

        expect(screen.getByTestId('asset-table')).toBeInTheDocument();
    });

    it('has a filter button', () => {
        render(<MarketsPage />);

        expect(screen.getByText('Filter')).toBeInTheDocument();
    });
});
