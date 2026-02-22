export interface FormattedMarket {
    asset: string;
    symbol: string;
    decimals: number;
    ltv: string;
    liqThreshold: string;
    supplyAPY: string;
    borrowAPY: string;
    totalSupplied: string;
    totalBorrowed: string;
    availableLiquidity: string;
    priceUsd: string;
}

export interface IMarketsService {
    getAllMarkets(): Promise<FormattedMarket[]>;
    getMarketByAsset(asset: string): Promise<FormattedMarket | null>;
}
