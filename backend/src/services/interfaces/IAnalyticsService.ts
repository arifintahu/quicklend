export interface TvlBreakdown {
    total: number;
    byAsset: Record<string, number>;
}

export interface TvlHistoryPoint {
    date: string;
    tvl: number;
}

export interface LiquidationDTO {
    txHash: string;
    liquidator: string;
    userLiquidated: string;
    collateralAsset: string;
    debtAsset: string;
    debtCovered: string | null;
    collateralSeized: string | null;
    profitUsd: string | null;
    timestamp: Date;
}

export interface IAnalyticsService {
    getTvl(): Promise<TvlBreakdown>;
    getTvlHistory(days: number): Promise<TvlHistoryPoint[]>;
    getLiquidations(days: number): Promise<LiquidationDTO[]>;
}
