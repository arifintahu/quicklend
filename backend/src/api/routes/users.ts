import { FastifyPluginAsync } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { db, schema } from '../../db/index.js';
import { eq, and } from 'drizzle-orm';

const AddressParamsSchema = Type.Object({
    address: Type.String({ pattern: '^0x[a-fA-F0-9]{40}$' }),
});

const PaginationQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});

const UserPositionSchema = Type.Object({
    asset: Type.String(),
    symbol: Type.String(),
    suppliedBalance: Type.String(),
    borrowedBalance: Type.String(),
    isCollateral: Type.Boolean(),
});

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
    // GET /api/v1/users/:address/positions
    fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/positions', {
        schema: {
            tags: ['Users'],
            summary: 'Get user positions',
            params: AddressParamsSchema,
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    data: Type.Array(UserPositionSchema),
                }),
            },
        },
    }, async (request, reply) => {
        const { address } = request.params;

        try {
            const positions = await db.query.userPositions.findMany({
                where: eq(schema.userPositions.userAddress, address.toLowerCase()),
            });

            return {
                success: true,
                data: positions.map((p) => ({
                    asset: p.asset,
                    symbol: p.symbol || '',
                    suppliedBalance: p.suppliedBalance || '0',
                    borrowedBalance: p.borrowedBalance || '0',
                    isCollateral: p.isCollateral ?? true,
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

    // GET /api/v1/users/:address/health
    fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/health', {
        schema: {
            tags: ['Users'],
            summary: 'Get user health factor',
            params: AddressParamsSchema,
        },
    }, async (request, reply) => {
        const { address } = request.params;

        try {
            // Get the most recent position with health factor
            const position = await db.query.userPositions.findFirst({
                where: eq(schema.userPositions.userAddress, address.toLowerCase()),
            });

            const healthFactor = position?.healthFactor
                ? parseFloat(position.healthFactor)
                : 0;

            return {
                success: true,
                data: {
                    healthFactor,
                    status: healthFactor >= 1.5 ? 'safe' : healthFactor >= 1.2 ? 'warning' : 'danger',
                },
            };
        } catch (error) {
            fastify.log.error(error);
            return {
                success: true,
                data: { healthFactor: 0, status: 'unknown' },
            };
        }
    });

    // GET /api/v1/users/:address/history
    fastify.get<{
        Params: Static<typeof AddressParamsSchema>;
        Querystring: Static<typeof PaginationQuerySchema>;
    }>('/:address/history', {
        schema: {
            tags: ['Users'],
            summary: 'Get user transaction history',
            params: AddressParamsSchema,
            querystring: PaginationQuerySchema,
        },
    }, async (request, reply) => {
        const { address } = request.params;
        const { page = 1, limit = 20 } = request.query;

        try {
            const events = await db.query.events.findMany({
                where: eq(schema.events.userAddress, address.toLowerCase()),
                orderBy: (events, { desc }) => [desc(events.blockNumber)],
                limit,
                offset: (page - 1) * limit,
            });

            return {
                success: true,
                data: events.map((e) => ({
                    txHash: e.txHash,
                    blockNumber: e.blockNumber?.toString(),
                    eventName: e.eventName,
                    asset: e.asset,
                    amount: e.amount,
                    timestamp: e.createdAt,
                })),
                pagination: {
                    page,
                    limit,
                },
            };
        } catch (error) {
            fastify.log.error(error);
            return {
                success: true,
                data: [],
                pagination: { page, limit },
            };
        }
    });
};
