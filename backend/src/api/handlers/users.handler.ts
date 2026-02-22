import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Static } from '@sinclair/typebox';
import type { IUsersService } from '../../services/interfaces/IUsersService.js';
import type { AddressParamsSchema, PaginationQuerySchema } from '../schemas/users.schema.js';

export class UsersHandler {
    constructor(private readonly usersService: IUsersService) {}

    getPositions = async (
        request: FastifyRequest<{ Params: Static<typeof AddressParamsSchema> }>,
        _reply: FastifyReply
    ) => {
        try {
            const data = await this.usersService.getPositions(request.params.address);
            return { success: true, data };
        } catch {
            return { success: true, data: [] };
        }
    };

    getHealthFactor = async (
        request: FastifyRequest<{ Params: Static<typeof AddressParamsSchema> }>,
        _reply: FastifyReply
    ) => {
        try {
            const data = await this.usersService.getHealthFactor(request.params.address);
            return { success: true, data };
        } catch {
            return { success: true, data: { healthFactor: 0, status: 'unknown' } };
        }
    };

    getHistory = async (
        request: FastifyRequest<{
            Params: Static<typeof AddressParamsSchema>;
            Querystring: Static<typeof PaginationQuerySchema>;
        }>,
        _reply: FastifyReply
    ) => {
        // Number() coercion handles both cases: schema-coerced numbers (production)
        // and raw query strings (test injection without schema).
        const page = Number(request.query.page ?? 1);
        const limit = Number(request.query.limit ?? 20);
        try {
            const result = await this.usersService.getHistory(request.params.address, page, limit);
            return { success: true, ...result };
        } catch {
            return { success: true, data: [], pagination: { page, limit } };
        }
    };
}
