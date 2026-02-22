import type { MarketSnapshot } from '../../db/schema.js';

export interface NewMarketSnapshotData {
    asset: string;
    symbol: string;
    totalSupplied: string;
    totalBorrowed: string;
    supplyRate: string;
    borrowRate: string;
    utilization: string;
    priceUsd: string;
    snapshotAt: Date;
}

export interface IMarketRepository {
    findLatestSnapshots(limit: number): Promise<MarketSnapshot[]>;
    findSnapshotsAfterDate(date: Date): Promise<MarketSnapshot[]>;
    saveSnapshot(data: NewMarketSnapshotData): Promise<void>;
}
