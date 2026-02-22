import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventProcessor } from '../../indexer/processor.js';
import type { IEventRepository } from '../../repositories/interfaces/IEventRepository.js';
import type { IUserRepository } from '../../repositories/interfaces/IUserRepository.js';
import type { DecodedEvent } from '../../indexer/interfaces/IEventProcessor.js';
import type { Log } from 'viem';

function makeLog(overrides: Partial<Log> = {}): Log {
    return {
        transactionHash: '0xtxhash',
        blockNumber: 42n,
        logIndex: 0,
        address: '0xpool',
        data: '0x',
        topics: [],
        blockHash: '0xblockhash',
        transactionIndex: 0,
        removed: false,
        ...overrides,
    } as unknown as Log;
}

function makeEvent(eventName: string, args: Record<string, unknown> = {}, logOverrides: Partial<Log> = {}): DecodedEvent {
    return {
        eventName,
        args: {
            user: '0xuser',
            asset: '0xasset',
            amount: 1000n,
            ...args,
        },
        log: makeLog(logOverrides),
    };
}

function makeEventRepo(): IEventRepository {
    return {
        insertEvent: vi.fn().mockResolvedValue(undefined),
        findIndexerState: vi.fn().mockResolvedValue(undefined),
        saveIndexerState: vi.fn().mockResolvedValue(undefined),
    };
}

function makeUserRepo(): IUserRepository {
    return {
        findPositionsByAddress: vi.fn().mockResolvedValue([]),
        findFirstPositionByAddress: vi.fn().mockResolvedValue(undefined),
        findEventsByAddress: vi.fn().mockResolvedValue([]),
        upsertPosition: vi.fn().mockResolvedValue(undefined),
    };
}

describe('EventProcessor', () => {
    let eventRepo: IEventRepository;
    let userRepo: IUserRepository;
    let processor: EventProcessor;

    beforeEach(() => {
        eventRepo = makeEventRepo();
        userRepo = makeUserRepo();
        processor = new EventProcessor(eventRepo, userRepo);
    });

    it('inserts the raw event into the event repository', async () => {
        await processor.process(makeEvent('Supply'));
        expect(eventRepo.insertEvent).toHaveBeenCalledOnce();
        const inserted = vi.mocked(eventRepo.insertEvent).mock.calls[0][0];
        expect(inserted.eventName).toBe('Supply');
        expect(inserted.txHash).toBe('0xtxhash');
    });

    describe('Supply', () => {
        it('upserts position with positive suppliedDelta', async () => {
            await processor.process(makeEvent('Supply', { amount: 500n }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { suppliedDelta: 500n }
            );
        });
    });

    describe('Withdraw', () => {
        it('upserts position with negative suppliedDelta', async () => {
            await processor.process(makeEvent('Withdraw', { amount: 200n }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { suppliedDelta: -200n }
            );
        });
    });

    describe('Borrow', () => {
        it('upserts position with positive borrowedDelta', async () => {
            await processor.process(makeEvent('Borrow', { amount: 300n }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { borrowedDelta: 300n }
            );
        });
    });

    describe('Repay', () => {
        it('upserts position with negative borrowedDelta', async () => {
            await processor.process(makeEvent('Repay', { amount: 150n }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { borrowedDelta: -150n }
            );
        });
    });

    describe('ReserveUsedAsCollateralEnabled', () => {
        it('sets isCollateral to true', async () => {
            await processor.process(makeEvent('ReserveUsedAsCollateralEnabled', { amount: undefined }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { isCollateral: true }
            );
        });
    });

    describe('ReserveUsedAsCollateralDisabled', () => {
        it('sets isCollateral to false', async () => {
            await processor.process(makeEvent('ReserveUsedAsCollateralDisabled', { amount: undefined }));
            expect(userRepo.upsertPosition).toHaveBeenCalledWith(
                '0xuser',
                '0xasset',
                { isCollateral: false }
            );
        });
    });

    it('lowercases userAddress and asset before persisting', async () => {
        await processor.process(makeEvent('Supply', {
            user: '0xUSER',
            asset: '0xASSET',
        }));
        const inserted = vi.mocked(eventRepo.insertEvent).mock.calls[0][0];
        expect(inserted.userAddress).toBe('0xuser');
        expect(inserted.asset).toBe('0xasset');
    });
});
