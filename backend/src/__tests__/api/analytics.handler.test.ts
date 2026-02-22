import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import type { IAnalyticsService, TvlBreakdown, TvlHistoryPoint, LiquidationDTO } from '../../services/interfaces/IAnalyticsService.js';
import { AnalyticsHandler } from '../../api/handlers/analytics.handler.js';

const MOCK_TVL: TvlBreakdown = { total: 1000, byAsset: { USDC: 1000 } };
const MOCK_HISTORY: TvlHistoryPoint[] = [{ date: '2024-03-15', tvl: 1000 }];
const MOCK_LIQUIDATIONS: LiquidationDTO[] = [{
    txHash: '0xtx',
    liquidator: '0xliq',
    userLiquidated: '0xuser',
    collateralAsset: '0xcol',
    debtAsset: '0xdebt',
    debtCovered: '100',
    collateralSeized: '120',
    profitUsd: '20',
    timestamp: new Date('2024-03-15'),
}];

function makeAnalyticsService(overrides: Partial<IAnalyticsService> = {}): IAnalyticsService {
    return {
        getTvl: vi.fn().mockResolvedValue(MOCK_TVL),
        getTvlHistory: vi.fn().mockResolvedValue(MOCK_HISTORY),
        getLiquidations: vi.fn().mockResolvedValue(MOCK_LIQUIDATIONS),
        ...overrides,
    };
}

async function buildApp(service: IAnalyticsService) {
    const fastify = Fastify();
    const handler = new AnalyticsHandler(service);
    fastify.get('/analytics/tvl', handler.getTvl);
    fastify.get<{ Querystring: { days?: number } }>('/analytics/tvl/history', handler.getTvlHistory);
    fastify.get<{ Querystring: { days?: number } }>('/analytics/liquidations', handler.getLiquidations);
    return fastify;
}

describe('AnalyticsHandler', () => {
    let service: IAnalyticsService;

    beforeEach(() => {
        service = makeAnalyticsService();
    });

    describe('getTvl', () => {
        it('returns current TVL', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/analytics/tvl' });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.data.total).toBe(1000);
            expect(body.data.byAsset.USDC).toBe(1000);
        });

        it('returns zero TVL on service error', async () => {
            service = makeAnalyticsService({ getTvl: vi.fn().mockRejectedValue(new Error('fail')) });
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/analytics/tvl' });
            expect(res.json().data.total).toBe(0);
        });
    });

    describe('getTvlHistory', () => {
        it('returns historical TVL data points', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/analytics/tvl/history' });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.data).toHaveLength(1);
            expect(body.data[0].date).toBe('2024-03-15');
        });

        it('passes days query param to service', async () => {
            const app = await buildApp(service);
            await app.inject({ method: 'GET', url: '/analytics/tvl/history?days=7' });
            expect(service.getTvlHistory).toHaveBeenCalledWith(7);
        });

        it('defaults to 30 days', async () => {
            const app = await buildApp(service);
            await app.inject({ method: 'GET', url: '/analytics/tvl/history' });
            expect(service.getTvlHistory).toHaveBeenCalledWith(30);
        });
    });

    describe('getLiquidations', () => {
        it('returns liquidation events', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/analytics/liquidations' });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.data).toHaveLength(1);
            expect(body.data[0].txHash).toBe('0xtx');
        });

        it('passes days query param to service', async () => {
            const app = await buildApp(service);
            await app.inject({ method: 'GET', url: '/analytics/liquidations?days=14' });
            expect(service.getLiquidations).toHaveBeenCalledWith(14);
        });

        it('defaults to 7 days', async () => {
            const app = await buildApp(service);
            await app.inject({ method: 'GET', url: '/analytics/liquidations' });
            expect(service.getLiquidations).toHaveBeenCalledWith(7);
        });
    });
});
