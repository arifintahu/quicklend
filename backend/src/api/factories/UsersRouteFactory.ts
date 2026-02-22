import type { FastifyPluginAsync } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IRouteFactory } from './IRouteFactory.js';
import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { UsersHandler } from '../handlers/users.handler.js';
import {
    AddressParamsSchema,
    PaginationQuerySchema,
    UserPositionsResponseSchema,
    HealthFactorResponseSchema,
    UserHistoryResponseSchema,
} from '../schemas/users.schema.js';

/**
 * Concrete route factory for the /api/v1/users domain.
 * Builds handler + Swagger-documented routes for positions, health factor,
 * and transaction history endpoints.
 */
export class UsersRouteFactory implements IRouteFactory {
    constructor(private readonly serviceFactory: IServiceFactory) {}

    createPlugin(): FastifyPluginAsync {
        const handler = new UsersHandler(this.serviceFactory.createUsersService());

        return async (fastify) => {
            // GET /api/v1/users/:address/positions
            fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/positions', {
                schema: {
                    tags: ['Users'],
                    summary: 'Get user positions',
                    description:
                        'Returns all materialized supply and borrow positions for the given wallet address.',
                    params: AddressParamsSchema,
                    response: { 200: UserPositionsResponseSchema },
                },
            }, handler.getPositions);

            // GET /api/v1/users/:address/health
            fastify.get<{ Params: Static<typeof AddressParamsSchema> }>('/:address/health', {
                schema: {
                    tags: ['Users'],
                    summary: 'Get user health factor',
                    description:
                        'Returns the current health factor for the given wallet. ' +
                        'A value below 1.0 means the position is eligible for liquidation.',
                    params: AddressParamsSchema,
                    response: { 200: HealthFactorResponseSchema },
                },
            }, handler.getHealthFactor);

            // GET /api/v1/users/:address/history
            fastify.get<{
                Params: Static<typeof AddressParamsSchema>;
                Querystring: Static<typeof PaginationQuerySchema>;
            }>('/:address/history', {
                schema: {
                    tags: ['Users'],
                    summary: 'Get user transaction history',
                    description:
                        'Paginated list of indexed blockchain events (Supply, Borrow, Repay, etc.) ' +
                        'for the given wallet address, ordered newest-first.',
                    params: AddressParamsSchema,
                    querystring: PaginationQuerySchema,
                    response: { 200: UserHistoryResponseSchema },
                },
            }, handler.getHistory);
        };
    }
}
