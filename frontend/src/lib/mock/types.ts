export interface Asset {
  symbol: string;
  name: string;
  logo: string; // Placeholder for now
  decimals: number;
}

export interface MarketData {
  asset: Asset;
  supplyAPY: number; // e.g., 0.05 for 5%
  borrowAPY: number; // e.g., 0.08 for 8%
  totalSupplied: number;
  totalBorrowed: number;
  ltv: number; // Loan to Value, e.g., 0.80
  liquidationThreshold: number; // e.g., 0.85
  price: number; // Mock price in USD
}

export interface UserPosition {
  assetSymbol: string;
  suppliedAmount: number;
  borrowedAmount: number;
  isCollateral: boolean;
}

export interface HealthFactorData {
  healthFactor: number;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  netAPY: number;
  borrowPowerUsed: number; // 0 to 1
}
