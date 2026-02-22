import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IAnalyticsService } from '../../services/interfaces/IAnalyticsService.js';
import type { DaysQuerySchema } from '../schemas/analytics.schema.js';

export class AnalyticsHandler {
    constructor(private readonly analyticsService: IAnalyticsService) {}

    getTvl = async (_request: FastifyRequest, _reply: FastifyReply) => {
        try {
            const data = await this.analyticsService.getTvl();
            return { success: true, data, timestamp: new Date().toISOString() };
        } catch {
            return { success: true, data: { total: 0, byAsset: {} }, timestamp: new Date().toISOString() };
        }
    };

    getTvlHistory = async (
        request: FastifyRequest<{ Querystring: Static<typeof DaysQuerySchema> }>,
        _reply: FastifyReply
    ) => {
        const days = Number(request.query.days ?? 30);
        try {
            const data = await this.analyticsService.getTvlHistory(days);
            return { success: true, data };
        } catch {
            return { success: true, data: [] };
        }
    };

    getLiquidations = async (
        request: FastifyRequest<{ Querystring: Static<typeof DaysQuerySchema> }>,
        _reply: FastifyReply
    ) => {
        const days = Number(request.query.days ?? 7);
        try {
            const data = await this.analyticsService.getLiquidations(days);
            return { success: true, data };
        } catch {
            return { success: true, data: [] };
        }
    };
}
