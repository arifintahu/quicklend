import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from './config/index.js';
import { marketsRoutes } from './api/routes/markets.js';
import { usersRoutes } from './api/routes/users.js';
import { analyticsRoutes } from './api/routes/analytics.js';
import { healthRoutes } from './api/routes/health.js';

async function buildServer() {
    const fastify = Fastify({
        logger: {
            level: config.isDev ? 'debug' : 'info',
            transport: config.isDev
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
    });

    // Register CORS
    await fastify.register(cors, {
        origin: config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    // Register Rate Limiting
    await fastify.register(rateLimit, {
        max: config.rateLimit.max,
        timeWindow: config.rateLimit.timeWindow,
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: () => ({
            success: false,
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
        }),
    });

    // Register Swagger
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'QuickLend API',
                description: 'API for QuickLend DeFi lending protocol',
                version: '1.0.0',
            },
            servers: [
                { url: `http://localhost:${config.port}`, description: 'Development' },
                { url: 'https://api.quicklend.xyz', description: 'Production' },
            ],
            tags: [
                { name: 'Health', description: 'Health check endpoints' },
                { name: 'Markets', description: 'Lending market data' },
                { name: 'Users', description: 'User positions and history' },
                { name: 'Analytics', description: 'Protocol metrics' },
            ],
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    // Register routes
    await fastify.register(healthRoutes, { prefix: '/health' });
    await fastify.register(marketsRoutes, { prefix: '/api/v1/markets' });
    await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
    await fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        const statusCode = error.statusCode || 500;
        const isProduction = !config.isDev;

        fastify.log.error({
            err: error,
            requestId: request.id,
            url: request.url,
            method: request.method,
        });

        reply.status(statusCode).send({
            success: false,
            error: isProduction && statusCode === 500 ? 'Internal server error' : error.message,
            code: error.code || 'INTERNAL_ERROR',
            ...(isProduction ? {} : { stack: error.stack }),
        });
    });

    return fastify;
}

// Start server
buildServer().then((server) => {
    server.listen({ port: config.port, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }
        server.log.info(`🚀 QuickLend API running at ${address}`);
        server.log.info(`📚 API docs at ${address}/docs`);
        server.log.info(`🔗 Chain ID: ${config.chainId}`);
        if (config.lendingPoolAddress) {
            server.log.info(`📝 LendingPool: ${config.lendingPoolAddress}`);
        } else {
            server.log.warn('⚠️  Contracts not configured. Set LENDING_POOL_ADDRESS');
        }
    });
}).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
