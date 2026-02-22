import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from '../../services/UsersService.js';
import type { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';
import type { UserPosition, Event } from '../../db/schema.js';

function makeUserPosition(overrides: Partial<UserPosition> = {}): UserPosition {
    return {
        id: 1,
        userAddress: '0xabc',
        asset: '0xtoken',
        symbol: 'USDC',
        suppliedBalance: '1000000000',
        borrowedBalance: '0',
        isCollateral: true,
        healthFactor: '2.5',
        updatedAt: new Date(),
        ...overrides,
    };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: 1,
        txHash: '0xtx123',
        blockNumber: 100n,
        logIndex: 0,
        eventName: 'Supply',
        userAddress: '0xabc',
        asset: '0xtoken',
        amount: '1000',
        data: null,
        createdAt: new Date('2024-01-01'),
        ...overrides,
    };
}

function makeRepository(overrides: Partial<IUserRepository> = {}): IUserRepository {
    return {
        findPositionsByAddress: vi.fn().mockResolvedValue([makeUserPosition()]),
        findFirstPositionByAddress: vi.fn().mockResolvedValue(makeUserPosition()),
        findEventsByAddress: vi.fn().mockResolvedValue([makeEvent()]),
        upsertPosition: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

describe('UsersService', () => {
    let repo: IUserRepository;
    let service: UsersService;

    beforeEach(() => {
        repo = makeRepository();
        service = new UsersService(repo);
    });

    describe('getPositions', () => {
        it('returns formatted positions for an address', async () => {
            const result = await service.getPositions('0xabc');
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                asset: '0xtoken',
                symbol: 'USDC',
                suppliedBalance: '1000000000',
                borrowedBalance: '0',
                isCollateral: true,
            });
        });

        it('falls back to empty string for null symbol', async () => {
            repo = makeRepository({
                findPositionsByAddress: vi.fn().mockResolvedValue([makeUserPosition({ symbol: null })]),
            });
            service = new UsersService(repo);
            const [pos] = await service.getPositions('0xabc');
            expect(pos.symbol).toBe('');
        });

        it('delegates to repository with the provided address', async () => {
            await service.getPositions('0xDEAD');
            expect(repo.findPositionsByAddress).toHaveBeenCalledWith('0xDEAD');
        });
    });

    describe('getHealthFactor', () => {
        it('returns safe status when HF >= 1.5', async () => {
            const result = await service.getHealthFactor('0xabc');
            expect(result.status).toBe('safe');
            expect(result.healthFactor).toBe(2.5);
        });

        it('returns warning status when 1.2 <= HF < 1.5', async () => {
            repo = makeRepository({
                findFirstPositionByAddress: vi.fn().mockResolvedValue(makeUserPosition({ healthFactor: '1.3' })),
            });
            service = new UsersService(repo);
            const result = await service.getHealthFactor('0xabc');
            expect(result.status).toBe('warning');
        });

        it('returns danger status when 0 < HF < 1.2', async () => {
            repo = makeRepository({
                findFirstPositionByAddress: vi.fn().mockResolvedValue(makeUserPosition({ healthFactor: '0.9' })),
            });
            service = new UsersService(repo);
            const result = await service.getHealthFactor('0xabc');
            expect(result.status).toBe('danger');
        });

        it('returns unknown when no position exists', async () => {
            repo = makeRepository({
                findFirstPositionByAddress: vi.fn().mockResolvedValue(undefined),
            });
            service = new UsersService(repo);
            const result = await service.getHealthFactor('0xabc');
            expect(result.status).toBe('unknown');
            expect(result.healthFactor).toBe(0);
        });
    });

    describe('getHistory', () => {
        it('returns paginated history', async () => {
            const result = await service.getHistory('0xabc', 1, 20);
            expect(result.data).toHaveLength(1);
            expect(result.pagination).toEqual({ page: 1, limit: 20 });
        });

        it('calculates correct offset: page 2, limit 10 → offset 10', async () => {
            await service.getHistory('0xabc', 2, 10);
            expect(repo.findEventsByAddress).toHaveBeenCalledWith('0xabc', 10, 10);
        });

        it('maps event fields to TransactionDTO', async () => {
            const result = await service.getHistory('0xabc', 1, 20);
            const dto = result.data[0];
            expect(dto.txHash).toBe('0xtx123');
            expect(dto.eventName).toBe('Supply');
            expect(dto.blockNumber).toBe('100');
        });
    });
});
