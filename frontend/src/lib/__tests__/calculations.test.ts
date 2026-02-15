import { describe, it, expect } from 'vitest';
import { calculateHealthFactor } from '../calculations';
import type { MarketData } from '@/hooks/useMarkets';
import type { UserPosition } from '@/hooks/useUserPositions';

// Test fixtures
const mockMarkets: MarketData[] = [
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
    {
        asset: '0x3333333333333333333333333333333333333333',
        symbol: 'WBTC',
        decimals: 8,
        ltv: 0.7,
        liquidationThreshold: 0.75,
        supplyAPY: 0.015,
        borrowAPY: 0.035,
        totalSupplied: 100,
        totalBorrowed: 40,
        availableLiquidity: 60,
        price: 45_000,
    },
];

describe('calculateHealthFactor', () => {
    it('returns default values with no positions', () => {
        const result = calculateHealthFactor(mockMarkets, []);

        expect(result.healthFactor).toBe(100);
        expect(result.totalCollateralUSD).toBe(0);
        expect(result.totalDebtUSD).toBe(0);
        expect(result.netAPY).toBe(0);
        expect(result.borrowPowerUsed).toBe(0);
        expect(result.liquidationPrice).toBeUndefined();
    });

    it('calculates correctly with supply-only position (no debt)', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: true,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        expect(result.totalCollateralUSD).toBe(25_000); // 10 * 2500
        expect(result.totalDebtUSD).toBe(0);
        expect(result.healthFactor).toBe(100); // No debt = max health
        expect(result.borrowPowerUsed).toBe(0);
    });

    it('calculates health factor with collateral and debt', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 0,
                borrowedAmount: 10_000,
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // Collateral: 10 * 2500 = 25,000
        // Weighted: 25,000 * 0.8 (liq threshold) = 20,000
        // Debt: 10,000 * 1 = 10,000
        // HF: 20,000 / 10,000 = 2.0
        expect(result.totalCollateralUSD).toBe(25_000);
        expect(result.totalDebtUSD).toBe(10_000);
        expect(result.healthFactor).toBe(2.0);

        // Borrow power: 25,000 * 0.75 (LTV) = 18,750
        // Used: 10,000 / 18,750 ≈ 0.5333
        expect(result.borrowPowerUsed).toBeCloseTo(0.5333, 3);
    });

    it('calculates netAPY from weighted positions', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 0,
                borrowedAmount: 5_000,
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // supplyIncome = 25,000 * 0.02 = 500
        // borrowCost = 5,000 * 0.05 = 250
        // equity = 25,000 - 5,000 = 20,000
        // netAPY = (500 - 250) / 20,000 = 0.0125
        expect(result.netAPY).toBeCloseTo(0.0125, 4);
    });

    it('returns netAPY=0 when equity is zero or negative', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 0,
                borrowedAmount: 10_000,
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        expect(result.netAPY).toBe(0);
    });

    it('calculates liquidation price when applicable', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 0,
                borrowedAmount: 15_000,
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // otherCollateralWeighted = 0 (only WETH is collateral)
        // liqPrice = (15,000 - 0) / (10 * 0.8) = 15,000 / 8 = 1,875
        expect(result.liquidationPrice).toBeCloseTo(1875, 0);
    });

    it('returns undefined liquidation price when not calculable', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: true,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        expect(result.liquidationPrice).toBeUndefined();
    });

    it('ignores positions with no matching market', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x9999999999999999999999999999999999999999',
                symbol: 'UNKNOWN',
                suppliedAmount: 1000,
                borrowedAmount: 500,
                isCollateral: true,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        expect(result.totalCollateralUSD).toBe(0);
        expect(result.totalDebtUSD).toBe(0);
    });

    it('handles non-collateral supply positions correctly', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 10,
                borrowedAmount: 0,
                isCollateral: false, // Not used as collateral
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // Should NOT count as collateral
        expect(result.totalCollateralUSD).toBe(0);
        expect(result.borrowPowerUsed).toBe(0);
    });

    it('handles multi-collateral scenario', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 4,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x3333333333333333333333333333333333333333',
                symbol: 'WBTC',
                suppliedAmount: 0.5,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 0,
                borrowedAmount: 5_000,
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // Collateral: 4*2500 + 0.5*45000 = 10,000 + 22,500 = 32,500
        expect(result.totalCollateralUSD).toBe(32_500);
        expect(result.totalDebtUSD).toBe(5_000);

        // Weighted: 10,000*0.8 + 22,500*0.75 = 8,000 + 16,875 = 24,875
        // HF: 24,875 / 5,000 = 4.975
        expect(result.healthFactor).toBeCloseTo(4.975, 2);
    });

    it('detects danger zone (health factor < 1)', () => {
        const positions: UserPosition[] = [
            {
                asset: '0x1111111111111111111111111111111111111111',
                symbol: 'USDC',
                suppliedAmount: 1000,
                borrowedAmount: 0,
                isCollateral: true,
            },
            {
                asset: '0x2222222222222222222222222222222222222222',
                symbol: 'WETH',
                suppliedAmount: 0,
                borrowedAmount: 0.5, // 0.5 * 2500 = 1250 debt
                isCollateral: false,
            },
        ];

        const result = calculateHealthFactor(mockMarkets, positions);

        // Collateral: 1000 * 1 = $1000, Weighted: 1000 * 0.85 = $850
        // Debt: 0.5 * 2500 = $1250
        // HF: 850 / 1250 = 0.68
        expect(result.healthFactor).toBeLessThan(1);
        expect(result.healthFactor).toBeCloseTo(0.68, 2);
    });
});
