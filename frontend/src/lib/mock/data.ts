import { MarketData, UserPosition, HealthFactorData } from './types';

export const MOCK_MARKETS: MarketData[] = [
  {
    asset: { symbol: 'USDC', name: 'USD Coin', logo: 'usdc', decimals: 6 },
    supplyAPY: 0.052,
    borrowAPY: 0.075,
    totalSupplied: 10000000,
    totalBorrowed: 8000000,
    ltv: 0.80,
    liquidationThreshold: 0.85,
    price: 1.0,
  },
  {
    asset: { symbol: 'ETH', name: 'Ethereum', logo: 'eth', decimals: 18 },
    supplyAPY: 0.031,
    borrowAPY: 0.045,
    totalSupplied: 5000,
    totalBorrowed: 2000,
    ltv: 0.75,
    liquidationThreshold: 0.80,
    price: 3200.0,
  },
  {
    asset: { symbol: 'WBTC', name: 'Wrapped Bitcoin', logo: 'wbtc', decimals: 8 },
    supplyAPY: 0.015,
    borrowAPY: 0.025,
    totalSupplied: 200,
    totalBorrowed: 50,
    ltv: 0.70,
    liquidationThreshold: 0.75,
    price: 65000.0,
  },
];

export const INITIAL_USER_POSITIONS: UserPosition[] = [
  {
    assetSymbol: 'USDC',
    suppliedAmount: 5000,
    borrowedAmount: 0,
    isCollateral: true,
  },
  {
    assetSymbol: 'ETH',
    suppliedAmount: 10, // $32,000
    borrowedAmount: 0,
    isCollateral: true,
  },
  {
    assetSymbol: 'WBTC',
    suppliedAmount: 0,
    borrowedAmount: 0.1, // $6,500
    isCollateral: false,
  },
];

export const calculateHealthFactor = (
  markets: MarketData[],
  positions: UserPosition[]
): HealthFactorData => {
  let totalCollateralUSD = 0;
  let totalDebtUSD = 0;
  let totalCollateralWeighted = 0; // Collateral * LiquidationThreshold

  positions.forEach((pos) => {
    const market = markets.find((m) => m.asset.symbol === pos.assetSymbol);
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
  const healthFactor = totalDebtUSD === 0 ? 999 : totalCollateralWeighted / totalDebtUSD;
  
  // Calculate Net APY (Simplified)
  // (SupplyIncome - BorrowCost) / TotalEquity
  // Equity = Supply - Debt (roughly)
  
  // Borrow Power Used
  const maxBorrow = positions.reduce((acc, pos) => {
     const market = markets.find((m) => m.asset.symbol === pos.assetSymbol);
     if (pos.isCollateral && market) {
         return acc + (pos.suppliedAmount * market.price * market.ltv);
     }
     return acc;
  }, 0);
  
  const borrowPowerUsed = maxBorrow === 0 ? 0 : totalDebtUSD / maxBorrow;

  return {
    healthFactor,
    totalCollateralUSD,
    totalDebtUSD,
    netAPY: 0.045, // Mocked for now, complex to calc precisely
    borrowPowerUsed,
  };
};
