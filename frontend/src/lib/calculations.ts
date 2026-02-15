import { MarketData } from '@/hooks/useMarkets';
import { UserPosition } from '@/hooks/useUserPositions';

export interface HealthFactorData {
    healthFactor: number;
    totalCollateralUSD: number;
    totalDebtUSD: number;
    netAPY: number;
    borrowPowerUsed: number;
    liquidationPrice?: number;
}

export const calculateHealthFactor = (
    markets: MarketData[],
    positions: UserPosition[]
): HealthFactorData => {
    let totalCollateralUSD = 0;
    let totalDebtUSD = 0;
    let totalCollateralWeighted = 0; // Collateral * LiquidationThreshold

    positions.forEach((pos) => {
        // Real data uses 'symbol'
        const market = markets.find((m) => m.symbol === pos.symbol);
        if (!market) return;

        const supplyUSD = pos.suppliedAmount * market.price;
        const borrowUSD = pos.borrowedAmount * market.price;

        if (pos.isCollateral) {
            totalCollateralUSD += supplyUSD;
            totalCollateralWeighted += supplyUSD * market.liquidationThreshold;
        }

        totalDebtUSD += borrowUSD;
    });

    // Avoid division by zero
    const healthFactor = totalDebtUSD === 0 ? 100 : totalCollateralWeighted / totalDebtUSD;

    // Calculate Net APY (Simplified)
    // (SupplyIncome - BorrowCost) / TotalEquity
    // Equity = Supply - Debt (roughly)

    // Borrow Power Used
    const maxBorrow = positions.reduce((acc, pos) => {
        const market = markets.find((m) => m.symbol === pos.symbol);
        if (pos.isCollateral && market) {
            return acc + (pos.suppliedAmount * market.price * market.ltv);
        }
        return acc;
    }, 0);

    const borrowPowerUsed = maxBorrow === 0 ? 0 : totalDebtUSD / maxBorrow;

    // Calculate Mock Liquidation Price for ETH (Main Collateral assumption)
    // This is a simplification and might need adjustment for multi-collateral
    let liquidationPrice = 0;

    // Try to find a major collateral to calculate liquidation price for
    const mainCollateral = positions.find(p => p.isCollateral && p.suppliedAmount > 0);

    if (mainCollateral && totalDebtUSD > 0) {
        const market = markets.find(m => m.symbol === mainCollateral.symbol);
        if (market) {
            const otherCollateralWeighted = totalCollateralWeighted - (mainCollateral.suppliedAmount * market.price * market.liquidationThreshold);

            if (otherCollateralWeighted < totalDebtUSD) {
                // Price where: (Price * Amount * Threshold) + OtherWeighted = Debt
                // Price = (Debt - OtherWeighted) / (Amount * Threshold)
                liquidationPrice = (totalDebtUSD - otherCollateralWeighted) / (mainCollateral.suppliedAmount * market.liquidationThreshold);
            }
        }
    }

    return {
        healthFactor,
        totalCollateralUSD,
        totalDebtUSD,
        netAPY: 0.045, // Placeholder/Simplified
        borrowPowerUsed,
        liquidationPrice: liquidationPrice > 0 ? liquidationPrice : undefined
    };
};
