import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { publicClient, config } from '../../lib/viem.js';

// Response schemas
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

export const marketsRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/v1/markets - List all markets
    fastify.get('/', {
        schema: {
            tags: ['Markets'],
            summary: 'Get all lending markets',
            description: 'Returns current data for all listed lending markets',
            response: {
                200: MarketsResponseSchema,
            },
        },
    }, async (request, reply) => {
        // In production, fetch from UiPoolDataProvider contract
        // For now, return empty array if not configured
        if (!config.lendingPoolAddress || !config.uiDataProviderAddress) {
            return {
                success: true,
                data: [],
                timestamp: new Date().toISOString(),
                message: 'Contracts not configured. Set LENDING_POOL_ADDRESS and UI_DATA_PROVIDER_ADDRESS.',
            };
        }

        // TODO: Implement actual contract call
        // const data = await publicClient.readContract({...})

        return {
            success: true,
            data: [],
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
    }, async (request, reply) => {
        const { asset } = request.params;

        // TODO: Implement actual contract call or database lookup

        return {
            success: false,
            error: 'Market not found',
        };
    });
};
