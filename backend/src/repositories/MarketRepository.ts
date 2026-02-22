import { db, schema } from '../db/index.js';
import type { IMarketRepository, NewMarketSnapshotData } from './interfaces/IMarketRepository.js';
import type { MarketSnapshot } from '../db/schema.js';

export class MarketRepository implements IMarketRepository {
    async findLatestSnapshots(limit: number): Promise<MarketSnapshot[]> {
        return db.query.marketSnapshots.findMany({
            orderBy: (snapshots, { desc }) => [desc(snapshots.snapshotAt)],
            limit,
        });
    }

    async findSnapshotsAfterDate(date: Date): Promise<MarketSnapshot[]> {
        return db.query.marketSnapshots.findMany({
            where: (snapshots, { gte }) => gte(snapshots.snapshotAt, date),
            orderBy: (snapshots, { asc }) => [asc(snapshots.snapshotAt)],
        });
    }

    async saveSnapshot(data: NewMarketSnapshotData): Promise<void> {
        await db.insert(schema.marketSnapshots).values(data);
    }
}
