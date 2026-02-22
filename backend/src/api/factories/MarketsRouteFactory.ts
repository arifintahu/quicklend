import type { FastifyPluginAsync } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IRouteFactory } from './IRouteFactory.js';
import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { MarketsHandler } from '../handlers/markets.handler.js';
import {
    MarketsResponseSchema,
    MarketResponseSchema,
    AssetParamsSchema,
} from '../schemas/markets.schema.js';

/**
 * Concrete route factory for the /api/v1/markets domain.
 * Wires schema definitions with the MarketsHandler and produces a
 * fully Swagger-documented Fastify plugin.
 */
export class MarketsRouteFactory implements IRouteFactory {
    constructor(private readonly serviceFactory: IServiceFactory) {}

    createPlugin(): FastifyPluginAsync {
        const handler = new MarketsHandler(this.serviceFactory.createMarketsService());

        return async (fastify) => {
            // GET /api/v1/markets
            fastify.get('/', {
                schema: {
                    tags: ['Markets'],
                    summary: 'List all lending markets',
                    description:
                        'Returns live data for every listed lending market including APYs, ' +
                        'liquidity, and current USD price. Results are cached for 30 seconds.',
                    response: { 200: MarketsResponseSchema },
                },
            }, handler.getAllMarkets);

            // GET /api/v1/markets/:asset
            fastify.get<{ Params: Static<typeof AssetParamsSchema> }>('/:asset', {
                schema: {
                    tags: ['Markets'],
                    summary: 'Get a single lending market',
                    description: 'Returns data for the lending market identified by the ERC-20 token address.',
                    params: AssetParamsSchema,
                    response: { 200: MarketResponseSchema },
                },
            }, handler.getMarketByAsset);
        };
    }
}
