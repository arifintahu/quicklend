import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IMarketsService } from '../../services/interfaces/IMarketsService.js';
import type { AssetParamsSchema } from '../schemas/markets.schema.js';

export class MarketsHandler {
    constructor(private readonly marketsService: IMarketsService) {}

    getAllMarkets = async (_request: FastifyRequest, _reply: FastifyReply) => {
        const markets = await this.marketsService.getAllMarkets();
        return {
            success: true,
            data: markets,
            timestamp: new Date().toISOString(),
        };
    };

    getMarketByAsset = async (
        request: FastifyRequest<{ Params: Static<typeof AssetParamsSchema> }>,
        _reply: FastifyReply
    ) => {
        const { asset } = request.params;
        const market = await this.marketsService.getMarketByAsset(asset);

        if (!market) {
            return { success: false, error: 'Market not found' };
        }

        return { success: true, data: market, timestamp: new Date().toISOString() };
    };
}
