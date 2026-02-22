import type { MarketSnapshot, LiquidationLog } from '../../db/schema.js';

export interface IAnalyticsRepository {
    findLatestSnapshotsByAsset(): Promise<Map<string, MarketSnapshot>>;
    findHistoricalSnapshots(days: number): Promise<MarketSnapshot[]>;
    findRecentLiquidations(days: number, limit: number): Promise<LiquidationLog[]>;
}
