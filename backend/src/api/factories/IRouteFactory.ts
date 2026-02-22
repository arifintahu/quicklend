import type { FastifyPluginAsync } from 'fastify';

/**
 * Abstract Factory interface for building Fastify route plugins.
 * Each concrete factory encapsulates: schema definitions, handler creation,
 * and route registration for a specific API domain (health, markets, etc.).
 */
export interface IRouteFactory {
    createPlugin(): FastifyPluginAsync;
}
