import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { db, schema } from '../../db/index.js';
import { desc, sql } from 'drizzle-orm';

const DaysQuerySchema = Type.Object({
    days: Type.Optional(Type.Number({ minimum: 1, maximum: 365, default: 30 })),
});

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/v1/analytics/tvl
    fastify.get('/tvl', {
        schema: {
            tags: ['Analytics'],
            summary: 'Get current TVL',
        },
    }, async (request, reply) => {
        try {
            // Get latest snapshot for each asset
            const snapshots = await db.query.marketSnapshots.findMany({
                orderBy: (snapshots, { desc }) => [desc(snapshots.snapshotAt)],
                limit: 10, // Assume max 10 assets
            });

            // Group by asset and take latest
            const latestByAsset = new Map<string, typeof snapshots[0]>();
            for (const s of snapshots) {
                if (!latestByAsset.has(s.asset)) {
                    latestByAsset.set(s.asset, s);
                }
            }

            let totalTvl = 0;
            const byAsset: Record<string, number> = {};

            for (const [asset, snapshot] of latestByAsset) {
                const supplied = parseFloat(snapshot.totalSupplied || '0');
                const price = parseFloat(snapshot.priceUsd || '0');
                const tvl = supplied * price;
                byAsset[snapshot.symbol || asset] = tvl;
                totalTvl += tvl;
            }

            return {
                success: true,
                data: {
                    total: totalTvl,
                    byAsset,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            fastify.log.error(error);
            return {
                success: true,
                data: { total: 0, byAsset: {} },
                timestamp: new Date().toISOString(),
            };
        }
    });

    // GET /api/v1/analytics/tvl/history
    fastify.get<{ Querystring: Static<typeof DaysQuerySchema> }>('/tvl/history', {
        schema: {
            tags: ['Analytics'],
            summary: 'Get historical TVL',
            querystring: DaysQuerySchema,
        },
    }, async (request, reply) => {
        const { days = 30 } = request.query;

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshots = await db.query.marketSnapshots.findMany({
                where: (snapshots, { gte }) => gte(snapshots.snapshotAt, startDate),
                orderBy: (snapshots, { asc }) => [asc(snapshots.snapshotAt)],
            });

            // Aggregate by date
            const byDate = new Map<string, number>();
            for (const s of snapshots) {
                const date = s.snapshotAt.toISOString().split('T')[0];
                const supplied = parseFloat(s.totalSupplied || '0');
                const price = parseFloat(s.priceUsd || '0');
                const current = byDate.get(date) || 0;
                byDate.set(date, current + (supplied * price));
            }

            const history = Array.from(byDate.entries()).map(([date, tvl]) => ({
                date,
                tvl,
            }));

            return {
                success: true,
                data: history,
            };
        } catch (error) {
            fastify.log.error(error);
            return {
                success: true,
                data: [],
            };
        }
    });

    // GET /api/v1/analytics/liquidations
    fastify.get<{ Querystring: Static<typeof DaysQuerySchema> }>('/liquidations', {
        schema: {
            tags: ['Analytics'],
            summary: 'Get recent liquidations',
            querystring: DaysQuerySchema,
        },
    }, async (request, reply) => {
        const { days = 7 } = request.query;

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const liquidations = await db.query.liquidationLogs.findMany({
                where: (logs, { gte }) => gte(logs.createdAt, startDate),
                orderBy: (logs, { desc }) => [desc(logs.createdAt)],
                limit: 50,
            });

            return {
                success: true,
                data: liquidations.map((l) => ({
                    txHash: l.txHash,
                    liquidator: l.liquidator,
                    userLiquidated: l.userLiquidated,
                    collateralAsset: l.collateralAsset,
                    debtAsset: l.debtAsset,
                    debtCovered: l.debtCovered,
                    collateralSeized: l.collateralSeized,
                    profitUsd: l.profitUsd,
                    timestamp: l.createdAt,
                })),
            };
        } catch (error) {
            fastify.log.error(error);
            return {
                success: true,
                data: [],
            };
        }
    });
};
