import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import type { IHealthService, HealthStatus } from '../../services/interfaces/IHealthService.js';
import { HealthHandler } from '../../api/handlers/health.handler.js';

function makeHealthService(overrides: Partial<HealthStatus> = {}): IHealthService {
    return {
        getStatus: vi.fn().mockReturnValue({
            status: 'healthy',
            timestamp: '2024-01-01T00:00:00.000Z',
            uptime: 123,
            version: '1.0.0',
            ...overrides,
        }),
    };
}

async function buildApp(service: IHealthService) {
    const fastify = Fastify();
    const handler = new HealthHandler(service);
    fastify.get('/health', handler.getStatus);
    return fastify;
}

describe('HealthHandler', () => {
    it('returns 200 with health data', async () => {
        const app = await buildApp(makeHealthService());
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.status).toBe('healthy');
        expect(body.version).toBe('1.0.0');
    });

    it('delegates to the health service', async () => {
        const service = makeHealthService();
        const app = await buildApp(service);
        await app.inject({ method: 'GET', url: '/health' });
        expect(service.getStatus).toHaveBeenCalledOnce();
    });
});
