import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { publicClient, config } from '../../lib/viem.js';
import { cacheGet, cacheSet } from '../../lib/redis.js';
import { UI_POOL_DATA_PROVIDER_ABI } from '../../indexer/abi.js';
import { formatUnits } from 'viem';

const MarketSchema = Type.Object({
    asset: Type.String(),
    symbol: Type.String(),
    decimals: Type.Number(),
    ltv: Type.String(),
    liqThreshold: Type.String(),
    supplyAPY: Type.String(),
    borrowAPY: Type.String(),
    totalSupplied: Type.String(),
    totalBorrowed: Type.String(),
    availableLiquidity: Type.String(),
    priceUsd: Type.String(),
});

const MarketsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(MarketSchema),
    timestamp: Type.String(),
});

const AssetParamsSchema = Type.Object({
    asset: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
});

const CACHE_KEY = 'markets:all';
const CACHE_TTL = 30; // seconds

interface RawMarket {
    asset: string;
    symbol: string;
    decimals: number;
    ltv: bigint;
    liqThreshold: bigint;
    supplyRate: bigint;
    borrowRate: bigint;
    totalSupplied: bigint;
    totalBorrowed: bigint;
    availableLiquidity: bigint;
    priceUsd: bigint;
}

async function fetchMarkets() {
    if (!config.lendingPoolAddress || !config.uiDataProviderAddress) {
        return [];
    }

    // Check cache first
    const cached = await cacheGet<ReturnType<typeof formatMarkets>>(CACHE_KEY);
    if (cached) return cached;

    const data = await publicClient.readContract({
        address: config.uiDataProviderAddress,
        abi: UI_POOL_DATA_PROVIDER_ABI,
        functionName: 'getMarketData',
        args: [config.lendingPoolAddress],
    });

    const result = formatMarkets(data as RawMarket[]);
    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return result;
}

function formatMarkets(raw: RawMarket[]) {
    return raw.map((m) => ({
        asset: m.asset,
        symbol: m.symbol,
        decimals: m.decimals,
        ltv: formatUnits(m.ltv, 18),
        liqThreshold: formatUnits(m.liqThreshold, 18),
        supplyAPY: formatUnits(m.supplyRate, 18),
        borrowAPY: formatUnits(m.borrowRate, 18),
        totalSupplied: formatUnits(m.totalSupplied, m.decimals),
        totalBorrowed: formatUnits(m.totalBorrowed, m.decimals),
        availableLiquidity: formatUnits(m.availableLiquidity, m.decimals),
        priceUsd: formatUnits(m.priceUsd, 18),
    }));
}

export const marketsRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/v1/markets
    fastify.get('/', {
        schema: {
            tags: ['Markets'],
            summary: 'Get all lending markets',
            description: 'Returns current data for all listed lending markets',
            response: { 200: MarketsResponseSchema },
        },
    }, async (_request, _reply) => {
        const markets = await fetchMarkets();
        return {
            success: true,
            data: markets,
            timestamp: new Date().toISOString(),
        };
    });

    // GET /api/v1/markets/:asset
    fastify.get<{ Params: Static<typeof AssetParamsSchema> }>('/:asset', {
        schema: {
            tags: ['Markets'],
            summary: 'Get single market data',
            params: AssetParamsSchema,
        },
    }, async (request, _reply) => {
        const { asset } = request.params;
        const markets = await fetchMarkets();
        const market = markets.find(
            (m) => m.asset.toLowerCase() === asset.toLowerCase()
        );

        if (!market) {
            return { success: false, error: 'Market not found' };
        }

        return { success: true, data: market, timestamp: new Date().toISOString() };
    });
};
