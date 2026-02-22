import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import type { IUsersService, UserPositionDTO, HealthFactorDTO, UserHistoryDTO } from '../../services/interfaces/IUsersService.js';
import { UsersHandler } from '../../api/handlers/users.handler.js';

const MOCK_ADDRESS = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const MOCK_POSITIONS: UserPositionDTO[] = [{
    asset: '0xtoken',
    symbol: 'USDC',
    suppliedBalance: '1000',
    borrowedBalance: '0',
    isCollateral: true,
}];

const MOCK_HEALTH: HealthFactorDTO = { healthFactor: 2.5, status: 'safe' };

const MOCK_HISTORY: UserHistoryDTO = {
    data: [{
        txHash: '0xtx',
        blockNumber: '100',
        eventName: 'Supply',
        asset: '0xtoken',
        amount: '1000',
        timestamp: new Date('2024-01-01'),
    }],
    pagination: { page: 1, limit: 20 },
};

function makeUsersService(overrides: Partial<IUsersService> = {}): IUsersService {
    return {
        getPositions: vi.fn().mockResolvedValue(MOCK_POSITIONS),
        getHealthFactor: vi.fn().mockResolvedValue(MOCK_HEALTH),
        getHistory: vi.fn().mockResolvedValue(MOCK_HISTORY),
        ...overrides,
    };
}

async function buildApp(service: IUsersService) {
    const fastify = Fastify();
    const handler = new UsersHandler(service);
    fastify.get<{ Params: { address: string } }>('/users/:address/positions', handler.getPositions);
    fastify.get<{ Params: { address: string } }>('/users/:address/health', handler.getHealthFactor);
    fastify.get<{ Params: { address: string }; Querystring: { page?: number; limit?: number } }>(
        '/users/:address/history',
        handler.getHistory
    );
    return fastify;
}

describe('UsersHandler', () => {
    let service: IUsersService;

    beforeEach(() => {
        service = makeUsersService();
    });

    describe('getPositions', () => {
        it('returns 200 with positions', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/positions` });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(1);
            expect(body.data[0].symbol).toBe('USDC');
        });

        it('returns empty array on service error', async () => {
            service = makeUsersService({
                getPositions: vi.fn().mockRejectedValue(new Error('DB error')),
            });
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/positions` });
            expect(res.statusCode).toBe(200);
            expect(res.json().data).toEqual([]);
        });
    });

    describe('getHealthFactor', () => {
        it('returns health factor and status', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/health` });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.data.healthFactor).toBe(2.5);
            expect(body.data.status).toBe('safe');
        });

        it('returns unknown status on service error', async () => {
            service = makeUsersService({
                getHealthFactor: vi.fn().mockRejectedValue(new Error('DB error')),
            });
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/health` });
            expect(res.json().data.status).toBe('unknown');
        });
    });

    describe('getHistory', () => {
        it('returns paginated history', async () => {
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/history` });
            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(1);
            expect(body.pagination).toEqual({ page: 1, limit: 20 });
        });

        it('passes page and limit query params to service', async () => {
            const app = await buildApp(service);
            await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/history?page=2&limit=50` });
            expect(service.getHistory).toHaveBeenCalledWith(MOCK_ADDRESS, 2, 50);
        });

        it('returns empty data on service error', async () => {
            service = makeUsersService({
                getHistory: vi.fn().mockRejectedValue(new Error('DB error')),
            });
            const app = await buildApp(service);
            const res = await app.inject({ method: 'GET', url: `/users/${MOCK_ADDRESS}/history` });
            expect(res.json().data).toEqual([]);
        });
    });
});
