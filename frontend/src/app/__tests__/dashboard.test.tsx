import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../page';
import * as useMarketsModule from '@/hooks/useMarkets';
import * as useUserPositionsModule from '@/hooks/useUserPositions';
import * as useProtocolHealthModule from '@/hooks/useProtocolHealth';
import * as useLendingActionsModule from '@/hooks/useLendingActions';
import * as useWalletBalanceModule from '@/hooks/useWalletBalance';

// Mock all hooks
vi.mock('@/hooks/useMarkets');
vi.mock('@/hooks/useUserPositions');
vi.mock('@/hooks/useProtocolHealth');
vi.mock('@/hooks/useLendingActions');
vi.mock('@/hooks/useWalletBalance');

// Mock sub-components
vi.mock('@/components/organisms/Sidebar', () => ({
    Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));
vi.mock('@/components/organisms/Navbar', () => ({
    Navbar: () => <header data-testid="navbar">Navbar</header>,
}));
vi.mock('@/components/organisms/HealthDial', () => ({
    HealthDial: ({ healthFactor }: { healthFactor: number }) => (
        <div data-testid="health-dial">{healthFactor}</div>
    ),
}));
vi.mock('@/components/organisms/ActionCard', () => ({
    ActionCard: () => <div data-testid="action-card">ActionCard</div>,
}));
vi.mock('@/components/organisms/WelcomeModal', () => ({
    WelcomeModal: () => <div data-testid="welcome-modal">WelcomeModal</div>,
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

describe('Dashboard Page', () => {
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
        vi.spyOn(useProtocolHealthModule, 'useProtocolHealth').mockReturnValue({
            healthFactor: 0,
            status: 'none',
            isLoading: false,
            error: null,
            refetch: vi.fn(),
            isConnected: true,
        });
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
        vi.spyOn(useWalletBalanceModule, 'useWalletBalance').mockReturnValue({
            balance: 0,
            isLoading: false,
            refetch: vi.fn(),
        });
    });

    it('renders sidebar and navbar', () => {
        render(<Dashboard />);

        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('displays health factor section', () => {
        render(<Dashboard />);

        expect(screen.getByText('Protocol Health')).toBeInTheDocument();
    });

    it('displays Net APY', () => {
        render(<Dashboard />);

        expect(screen.getByText('Net APY')).toBeInTheDocument();
    });

    it('displays Collateral and Debt cards', () => {
        render(<Dashboard />);

        expect(screen.getByText('Collateral')).toBeInTheDocument();
        expect(screen.getByText('Debt')).toBeInTheDocument();
    });

    it('renders assets to supply section with markets', () => {
        render(<Dashboard />);

        // Both markets should appear in "Assets to Supply" and "Assets to Borrow" tables since no positions
        expect(screen.getByText('Assets to Supply')).toBeInTheDocument();
        expect(screen.getAllByText('USDC').length).toBeGreaterThan(0);
        expect(screen.getAllByText('WETH').length).toBeGreaterThan(0);
    });

    it('shows borrow power used', () => {
        render(<Dashboard />);

        expect(screen.getByText('Borrow Power Used')).toBeInTheDocument();
    });

    it('shows formatted health factor when no positions', () => {
        render(<Dashboard />);

        // With no positions, health factor is exactly 100, displayed as "100.00"
        expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('renders with user positions', () => {
        vi.spyOn(useUserPositionsModule, 'useUserPositions').mockReturnValue({
            positions: [
                {
                    asset: '0x2222222222222222222222222222222222222222',
                    symbol: 'WETH',
                    suppliedAmount: 10,
                    borrowedAmount: 0,
                    isCollateral: true,
                },
            ],
            userPositions: [
                {
                    asset: '0x2222222222222222222222222222222222222222',
                    symbol: 'WETH',
                    suppliedAmount: 10,
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

        render(<Dashboard />);

        // Should show $25,000.00 in at least one location (collateral card)
        expect(screen.getAllByText('$25,000.00').length).toBeGreaterThan(0);
    });
});
