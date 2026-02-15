import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get('/', {
        schema: {
            tags: ['Health'],
            summary: 'Health check endpoint',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        uptime: { type: 'number' },
                        version: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        };
    });
};
