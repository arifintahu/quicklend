import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../../services/AnalyticsService.js';
import type { IAnalyticsRepository } from '../../repositories/interfaces/IAnalyticsRepository.js';
import type { MarketSnapshot, LiquidationLog } from '../../db/schema.js';

function makeSnapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
    return {
        id: 1,
        asset: '0xusdc',
        symbol: 'USDC',
        totalSupplied: '1000',  // human-readable (already formatted for these tests)
        totalBorrowed: '500',
        supplyRate: '0.05',
        borrowRate: '0.10',
        utilization: '0.5',
        priceUsd: '1',          // $1
        snapshotAt: new Date('2024-03-15T12:00:00Z'),
        ...overrides,
    };
}

function makeLiquidation(overrides: Partial<LiquidationLog> = {}): LiquidationLog {
    return {
        id: 1,
        txHash: '0xtx',
        liquidator: '0xliq',
        userLiquidated: '0xuser',
        collateralAsset: '0xcol',
        debtAsset: '0xdebt',
        debtCovered: '100',
        collateralSeized: '120',
        profitUsd: '20',
        createdAt: new Date('2024-03-15'),
        ...overrides,
    };
}

function makeRepository(overrides: Partial<IAnalyticsRepository> = {}): IAnalyticsRepository {
    return {
        findLatestSnapshotsByAsset: vi.fn().mockResolvedValue(
            new Map([['0xusdc', makeSnapshot()]])
        ),
        findHistoricalSnapshots: vi.fn().mockResolvedValue([makeSnapshot()]),
        findRecentLiquidations: vi.fn().mockResolvedValue([makeLiquidation()]),
        ...overrides,
    };
}

describe('AnalyticsService', () => {
    let repo: IAnalyticsRepository;
    let service: AnalyticsService;

    beforeEach(() => {
        repo = makeRepository();
        service = new AnalyticsService(repo);
    });

    describe('getTvl', () => {
        it('calculates total TVL as sum of (totalSupplied × priceUsd)', async () => {
            const result = await service.getTvl();
            // 1000 USDC × $1 = $1000
            expect(result.total).toBeCloseTo(1000);
        });

        it('breaks down TVL by asset symbol', async () => {
            const result = await service.getTvl();
            expect(result.byAsset['USDC']).toBeCloseTo(1000);
        });

        it('returns zero TVL for empty snapshots', async () => {
            repo = makeRepository({
                findLatestSnapshotsByAsset: vi.fn().mockResolvedValue(new Map()),
            });
            service = new AnalyticsService(repo);
            const result = await service.getTvl();
            expect(result.total).toBe(0);
            expect(result.byAsset).toEqual({});
        });
    });

    describe('getTvlHistory', () => {
        it('aggregates snapshots by date', async () => {
            const result = await service.getTvlHistory(30);
            expect(result).toHaveLength(1);
            expect(result[0].date).toBe('2024-03-15');
            expect(result[0].tvl).toBeCloseTo(1000);
        });

        it('passes days parameter to repository', async () => {
            await service.getTvlHistory(7);
            expect(repo.findHistoricalSnapshots).toHaveBeenCalledWith(7);
        });

        it('sums TVL across multiple assets for the same date', async () => {
            const snapshots = [
                makeSnapshot({ asset: '0xusdc', symbol: 'USDC', totalSupplied: '1000', priceUsd: '1' }),
                makeSnapshot({ asset: '0xweth', symbol: 'WETH', totalSupplied: '1', priceUsd: '2500' }),
            ];
            repo = makeRepository({
                findHistoricalSnapshots: vi.fn().mockResolvedValue(snapshots),
            });
            service = new AnalyticsService(repo);
            const result = await service.getTvlHistory(30);
            expect(result).toHaveLength(1);
            expect(result[0].tvl).toBeCloseTo(3500);
        });
    });

    describe('getLiquidations', () => {
        it('maps liquidation logs to DTOs', async () => {
            const result = await service.getLiquidations(7);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                txHash: '0xtx',
                liquidator: '0xliq',
                userLiquidated: '0xuser',
                debtCovered: '100',
                profitUsd: '20',
            });
        });

        it('passes days parameter to repository', async () => {
            await service.getLiquidations(14);
            expect(repo.findRecentLiquidations).toHaveBeenCalledWith(14, 50);
        });

        it('returns empty array when no liquidations', async () => {
            repo = makeRepository({
                findRecentLiquidations: vi.fn().mockResolvedValue([]),
            });
            service = new AnalyticsService(repo);
            const result = await service.getLiquidations(7);
            expect(result).toEqual([]);
        });
    });
});
