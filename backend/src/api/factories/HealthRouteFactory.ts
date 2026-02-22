import type { FastifyPluginAsync } from 'fastify';
import type { IRouteFactory } from './IRouteFactory.js';
import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { HealthHandler } from '../handlers/health.handler.js';
import { HealthResponseSchema } from '../schemas/health.schema.js';

/**
 * Concrete route factory for the /health domain.
 * Creates the schema, instantiates the handler, and returns a Fastify plugin
 * with full Swagger/OpenAPI documentation attached to each route.
 */
export class HealthRouteFactory implements IRouteFactory {
    constructor(private readonly serviceFactory: IServiceFactory) {}

    createPlugin(): FastifyPluginAsync {
        const handler = new HealthHandler(this.serviceFactory.createHealthService());

        return async (fastify) => {
            fastify.get('/', {
                schema: {
                    tags: ['Health'],
                    summary: 'Health check',
                    description: 'Returns service liveness status, uptime, and version.',
                    response: {
                        200: HealthResponseSchema,
                    },
                },
            }, handler.getStatus);
        };
    }
}
