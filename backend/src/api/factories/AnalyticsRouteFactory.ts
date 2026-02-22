import type { FastifyPluginAsync } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IRouteFactory } from './IRouteFactory.js';
import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { AnalyticsHandler } from '../handlers/analytics.handler.js';
import {
    DaysQuerySchema,
    TvlResponseSchema,
    TvlHistoryResponseSchema,
    LiquidationsResponseSchema,
} from '../schemas/analytics.schema.js';

/**
 * Concrete route factory for the /api/v1/analytics domain.
 * Produces Swagger-documented Fastify routes for TVL and liquidation metrics.
 */
export class AnalyticsRouteFactory implements IRouteFactory {
    constructor(private readonly serviceFactory: IServiceFactory) {}

    createPlugin(): FastifyPluginAsync {
        const handler = new AnalyticsHandler(this.serviceFactory.createAnalyticsService());

        return async (fastify) => {
            // GET /api/v1/analytics/tvl
            fastify.get('/tvl', {
                schema: {
                    tags: ['Analytics'],
                    summary: 'Current Total Value Locked',
                    description:
                        'Calculates TVL from the latest market snapshot for each asset. ' +
                        'TVL = totalSupplied × priceUsd per asset.',
                    response: { 200: TvlResponseSchema },
                },
            }, handler.getTvl);

            // GET /api/v1/analytics/tvl/history
            fastify.get<{ Querystring: Static<typeof DaysQuerySchema> }>('/tvl/history', {
                schema: {
                    tags: ['Analytics'],
                    summary: 'Historical TVL time-series',
                    description: 'Returns TVL aggregated by calendar day for the requested look-back period.',
                    querystring: DaysQuerySchema,
                    response: { 200: TvlHistoryResponseSchema },
                },
            }, handler.getTvlHistory);

            // GET /api/v1/analytics/liquidations
            fastify.get<{ Querystring: Static<typeof DaysQuerySchema> }>('/liquidations', {
                schema: {
                    tags: ['Analytics'],
                    summary: 'Recent liquidation events',
                    description: 'Returns up to 50 liquidation events within the given look-back window.',
                    querystring: DaysQuerySchema,
                    response: { 200: LiquidationsResponseSchema },
                },
            }, handler.getLiquidations);
        };
    }
}
