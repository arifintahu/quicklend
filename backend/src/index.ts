import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config } from './config/index.js';
import { DatabaseRepositoryFactory } from './repositories/DatabaseRepositoryFactory.js';
import { AppServiceFactory } from './services/AppServiceFactory.js';
import { buildHealthRoutes } from './api/routes/health.js';
import { buildMarketsRoutes } from './api/routes/markets.js';
import { buildUsersRoutes } from './api/routes/users.js';
import { buildAnalyticsRoutes } from './api/routes/analytics.js';
import { EventIndexer } from './indexer/indexer.js';

async function buildServer() {
    // Compose the factory graph:
    //   IRepositoryFactory → IServiceFactory → IRouteFactory → Fastify plugin
    const repositoryFactory = DatabaseRepositoryFactory.getInstance();
    const serviceFactory = new AppServiceFactory(repositoryFactory);

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

    // Register Swagger / OpenAPI
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'QuickLend API',
                description: 'REST API for the QuickLend decentralized lending protocol',
                version: '1.0.0',
            },
            servers: [
                { url: `http://localhost:${config.port}`, description: 'Development' },
                { url: 'https://api.quicklend.xyz', description: 'Production' },
            ],
            tags: [
                { name: 'Health', description: 'Service liveness endpoints' },
                { name: 'Markets', description: 'Lending market data (APYs, liquidity, prices)' },
                { name: 'Users', description: 'User positions, health factor, and transaction history' },
                { name: 'Analytics', description: 'Protocol-wide TVL and liquidation metrics' },
            ],
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: { docExpansion: 'list', deepLinking: true },
    });

    // Register route plugins produced by the Abstract Factory
    await fastify.register(buildHealthRoutes(serviceFactory), { prefix: '/health' });
    await fastify.register(buildMarketsRoutes(serviceFactory), { prefix: '/api/v1/markets' });
    await fastify.register(buildUsersRoutes(serviceFactory), { prefix: '/api/v1/users' });
    await fastify.register(buildAnalyticsRoutes(serviceFactory), { prefix: '/api/v1/analytics' });

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
        const statusCode = error.statusCode || 500;
        fastify.log.error({
            err: error,
            requestId: request.id,
            url: request.url,
            method: request.method,
        });

        reply.status(statusCode).send({
            success: false,
            error: !config.isDev && statusCode === 500 ? 'Internal server error' : error.message,
            code: error.code || 'INTERNAL_ERROR',
            ...(config.isDev ? { stack: error.stack } : {}),
        });
    });

    return fastify;
}

buildServer().then((server) => {
    server.listen({ port: config.port, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }
        server.log.info(`QuickLend API running at ${address}`);
        server.log.info(`API docs at ${address}/docs`);
        server.log.info(`Chain ID: ${config.chainId}`);

        const indexer = new EventIndexer();
        if (config.lendingPoolAddress) {
            server.log.info(`LendingPool: ${config.lendingPoolAddress}`);
            indexer.start().catch((err) => {
                server.log.error({ err }, 'Failed to start indexer');
            });

            const shutdown = async () => {
                await indexer.stop();
                await server.close();
                process.exit(0);
            };
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        } else {
            server.log.warn('Contracts not configured. Set LENDING_POOL_ADDRESS env var.');
        }
    });
}).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
