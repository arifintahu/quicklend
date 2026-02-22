import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IHealthService } from '../../services/interfaces/IHealthService.js';

export class HealthHandler {
    constructor(private readonly healthService: IHealthService) {}

    getStatus = async (_request: FastifyRequest, _reply: FastifyReply) => {
        return this.healthService.getStatus();
    };
}
