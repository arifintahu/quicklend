import { db, schema } from '../db/index.js';
import type { IAnalyticsRepository } from './interfaces/IAnalyticsRepository.js';
import type { MarketSnapshot, LiquidationLog } from '../db/schema.js';

export class AnalyticsRepository implements IAnalyticsRepository {
    async findLatestSnapshotsByAsset(): Promise<Map<string, MarketSnapshot>> {
        // Fetch recent snapshots (assume max 10 assets × a few snapshots each)
        const snapshots = await db.query.marketSnapshots.findMany({
            orderBy: (snapshots, { desc }) => [desc(snapshots.snapshotAt)],
            limit: 50,
        });

        const latestByAsset = new Map<string, MarketSnapshot>();
        for (const snapshot of snapshots) {
            if (!latestByAsset.has(snapshot.asset)) {
                latestByAsset.set(snapshot.asset, snapshot);
            }
        }
        return latestByAsset;
    }

    async findHistoricalSnapshots(days: number): Promise<MarketSnapshot[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return db.query.marketSnapshots.findMany({
            where: (snapshots, { gte }) => gte(snapshots.snapshotAt, startDate),
            orderBy: (snapshots, { asc }) => [asc(snapshots.snapshotAt)],
        });
    }

    async findRecentLiquidations(days: number, limit: number): Promise<LiquidationLog[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return db.query.liquidationLogs.findMany({
            where: (logs, { gte }) => gte(logs.createdAt, startDate),
            orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            limit,
        });
    }
}
