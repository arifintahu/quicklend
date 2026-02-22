import type { IAnalyticsService, TvlBreakdown, TvlHistoryPoint, LiquidationDTO } from './interfaces/IAnalyticsService.js';
import type { IAnalyticsRepository } from '../repositories/interfaces/IAnalyticsRepository.js';

export class AnalyticsService implements IAnalyticsService {
    constructor(private readonly analyticsRepository: IAnalyticsRepository) {}

    async getTvl(): Promise<TvlBreakdown> {
        const latestByAsset = await this.analyticsRepository.findLatestSnapshotsByAsset();

        let total = 0;
        const byAsset: Record<string, number> = {};

        for (const [, snapshot] of latestByAsset) {
            const supplied = parseFloat(snapshot.totalSupplied ?? '0');
            const price = parseFloat(snapshot.priceUsd ?? '0');
            const tvl = supplied * price;
            byAsset[snapshot.symbol ?? snapshot.asset] = tvl;
            total += tvl;
        }

        return { total, byAsset };
    }

    async getTvlHistory(days: number): Promise<TvlHistoryPoint[]> {
        const snapshots = await this.analyticsRepository.findHistoricalSnapshots(days);

        const byDate = new Map<string, number>();
        for (const s of snapshots) {
            const date = s.snapshotAt.toISOString().split('T')[0];
            const supplied = parseFloat(s.totalSupplied ?? '0');
            const price = parseFloat(s.priceUsd ?? '0');
            const current = byDate.get(date) ?? 0;
            byDate.set(date, current + supplied * price);
        }

        return Array.from(byDate.entries()).map(([date, tvl]) => ({ date, tvl }));
    }

    async getLiquidations(days: number): Promise<LiquidationDTO[]> {
        const liquidations = await this.analyticsRepository.findRecentLiquidations(days, 50);

        return liquidations.map((l) => ({
            txHash: l.txHash,
            liquidator: l.liquidator,
            userLiquidated: l.userLiquidated,
            collateralAsset: l.collateralAsset,
            debtAsset: l.debtAsset,
            debtCovered: l.debtCovered,
            collateralSeized: l.collateralSeized,
            profitUsd: l.profitUsd,
            timestamp: l.createdAt,
        }));
    }
}
