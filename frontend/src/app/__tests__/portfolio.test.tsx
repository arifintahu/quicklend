import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioPage from '../portfolio/page';
import * as useMarketsModule from '@/hooks/useMarkets';
import * as useUserPositionsModule from '@/hooks/useUserPositions';
import * as useLendingActionsModule from '@/hooks/useLendingActions';

vi.mock('@/hooks/useMarkets');
vi.mock('@/hooks/useUserPositions');
vi.mock('@/hooks/useLendingActions');

vi.mock('@/components/organisms/Sidebar', () => ({
    Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));
vi.mock('@/components/organisms/Navbar', () => ({
    Navbar: () => <header data-testid="navbar">Navbar</header>,
}));

const mockMarkets: useMarketsModule.MarketData[] = [
    {
        asset: '0x1111111111111111111111111111111111111111',
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
        asset: '0x2222222222222222222222222222222222222222',
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

describe('Portfolio Page', () => {
    beforeEach(() => {
        vi.spyOn(useLendingActionsModule, 'useLendingActions').mockReturnValue({
            supply: vi.fn(),
            withdraw: vi.fn(),
            borrow: vi.fn(),
            repay: vi.fn(),
            setCollateral: vi.fn(),
            liquidate: vi.fn(),
            txHash: undefined,
            isPending: false,
            isConfirming: false,
            isSuccess: false,
            error: null,
            reset: vi.fn(),
            isConnected: true,
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        });
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

    it('renders portfolio stats cards', () => {
        render(<PortfolioPage />);

        expect(screen.getByText('Net Worth')).toBeInTheDocument();
        expect(screen.getByText('Net APY')).toBeInTheDocument();
        expect(screen.getByText('Rewards')).toBeInTheDocument();
    });

    it('shows Coming Soon for rewards', () => {
        render(<PortfolioPage />);

        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(screen.getByText('Earn QuickLend points on every interaction (launching soon)')).toBeInTheDocument();
    });

    it('shows empty state for supplied assets', () => {
        render(<PortfolioPage />);

        expect(screen.getByText('No supplied assets')).toBeInTheDocument();
    });

    it('shows empty state for borrowed assets', () => {
        render(<PortfolioPage />);

        expect(screen.getByText('No borrowed assets')).toBeInTheDocument();
    });

    it('displays supplied assets when user has positions', () => {
        vi.spyOn(useUserPositionsModule, 'useUserPositions').mockReturnValue({
            positions: [
                {
                    asset: '0x2222222222222222222222222222222222222222',
                    symbol: 'WETH',
                    suppliedAmount: 5,
                    borrowedAmount: 0,
                    isCollateral: true,
                },
            ],
            userPositions: [
                {
                    asset: '0x2222222222222222222222222222222222222222',
                    symbol: 'WETH',
                    suppliedAmount: 5,
                    borrowedAmount: 0,
                    isCollateral: true,
                },
            ],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            isConnected: true,
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        });

        render(<PortfolioPage />);

        expect(screen.getByText('WETH')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // supplied amount
    });

    it('displays borrowed assets when user has borrows', () => {
        vi.spyOn(useUserPositionsModule, 'useUserPositions').mockReturnValue({
            positions: [
                {
                    asset: '0x1111111111111111111111111111111111111111',
                    symbol: 'USDC',
                    suppliedAmount: 0,
                    borrowedAmount: 1000,
                    isCollateral: false,
                },
            ],
            userPositions: [
                {
                    asset: '0x1111111111111111111111111111111111111111',
                    symbol: 'USDC',
                    suppliedAmount: 0,
                    borrowedAmount: 1000,
                    isCollateral: false,
                },
            ],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            isConnected: true,
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        });

        render(<PortfolioPage />);

        expect(screen.getByText('USDC')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument(); // borrowed amount
    });

    it('shows section headers', () => {
        render(<PortfolioPage />);

        expect(screen.getByText('Supplied Assets')).toBeInTheDocument();
        expect(screen.getByText('Borrowed Assets')).toBeInTheDocument();
    });
});
