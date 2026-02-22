import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import type { IMarketsService, FormattedMarket } from '../../services/interfaces/IMarketsService.js';
import { MarketsHandler } from '../../api/handlers/markets.handler.js';

const MOCK_MARKET: FormattedMarket = {
    asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
    ltv: '0.8',
    liqThreshold: '0.85',
    supplyAPY: '0.05',
    borrowAPY: '0.10',
    totalSupplied: '1000',
    totalBorrowed: '500',
    availableLiquidity: '500',
    priceUsd: '1',
};

function makeMarketsService(overrides: Partial<IMarketsService> = {}): IMarketsService {
    return {
        getAllMarkets: vi.fn().mockResolvedValue([MOCK_MARKET]),
        getMarketByAsset: vi.fn().mockResolvedValue(MOCK_MARKET),
        ...overrides,
    };
}

async function buildApp(service: IMarketsService) {
    const fastify = Fastify();
    const handler = new MarketsHandler(service);
    fastify.get('/markets', handler.getAllMarkets);
    fastify.get<{ Params: { asset: string } }>('/markets/:asset', handler.getMarketByAsset);
    return fastify;
}

describe('MarketsHandler', () => {
    let service: IMarketsService;

    beforeEach(() => {
        service = makeMarketsService();
    });

    describe('getAllMarkets', () => {
        it('returns 200 with markets array', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/markets' });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(1);
            expect(body.data[0].symbol).toBe('USDC');
        });

        it('includes a timestamp field', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/markets' });
            const body = res.json();
            expect(body.timestamp).toBeDefined();
            expect(() => new Date(body.timestamp)).not.toThrow();
        });
    });

    describe('getMarketByAsset', () => {
        it('returns the market when found', async () => {
            const app = await buildApp(service);
            const res = await app.inject({
                method: 'GET',
                url: `/markets/${MOCK_MARKET.asset}`,
            });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.data.symbol).toBe('USDC');
        });

        it('returns success:false when market is not found', async () => {
            service = makeMarketsService({
                getMarketByAsset: vi.fn().mockResolvedValue(null),
            });
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: '/markets/0x0000000000000000000000000000000000000000' });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Market not found');
        });
    });
});
