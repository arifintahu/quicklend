import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SnapshotJob } from '../../indexer/snapshots.js';
import type { ISnapshotBlockchainClient } from '../../indexer/snapshots.js';
import type { IMarketRepository } from '../../repositories/interfaces/IMarketRepository.js';

const MOCK_MARKET = {
    asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
    supplyRate: BigInt('50000000000000000'),  // 5%
    borrowRate: BigInt('100000000000000000'), // 10%
    totalSupplied: BigInt('1000000000'),      // 1000 USDC (6 dec)
    totalBorrowed: BigInt('500000000'),       // 500 USDC
    availableLiquidity: BigInt('500000000'),
    priceUsd: BigInt('1000000000000000000'),  // $1
};

function makeBlockchainClient(data = [MOCK_MARKET]): ISnapshotBlockchainClient {
    return { readContract: vi.fn().mockResolvedValue(data) };
}

function makeMarketRepo(): IMarketRepository {
    return {
        findLatestSnapshots: vi.fn().mockResolvedValue([]),
        findSnapshotsAfterDate: vi.fn().mockResolvedValue([]),
        saveSnapshot: vi.fn().mockResolvedValue(undefined),
    };
}

describe('SnapshotJob', () => {
    let blockchain: ISnapshotBlockchainClient;
    let repo: IMarketRepository;
    let job: SnapshotJob;
    const dummyAddr = '0x1111111111111111111111111111111111111111' as `0x${string}`;
    const dummyAbi = [] as const;

    beforeEach(() => {
        vi.useFakeTimers();
        blockchain = makeBlockchainClient();
        repo = makeMarketRepo();
        job = new SnapshotJob(blockchain, repo, dummyAddr, dummyAddr, dummyAbi, 60_000);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('takeSnapshot', () => {
        it('reads contract data and saves one snapshot per market', async () => {
            await job.takeSnapshot();
            expect(blockchain.readContract).toHaveBeenCalledOnce();
            expect(repo.saveSnapshot).toHaveBeenCalledOnce();
        });

        it('saves snapshot with lowercased asset address', async () => {
            await job.takeSnapshot();
            const saved = vi.mocked(repo.saveSnapshot).mock.calls[0][0];
            expect(saved.asset).toBe(MOCK_MARKET.asset.toLowerCase());
        });

        it('formats supply/borrow rates as 18-decimal strings', async () => {
            await job.takeSnapshot();
            const saved = vi.mocked(repo.saveSnapshot).mock.calls[0][0];
            expect(saved.supplyRate).toBe('0.05');
            expect(saved.borrowRate).toBe('0.1');
        });

        it('calculates utilization as borrowedRatio / suppliedRatio', async () => {
            await job.takeSnapshot();
            const saved = vi.mocked(repo.saveSnapshot).mock.calls[0][0];
            // 500 / 1000 = 0.5
            expect(parseFloat(saved.utilization)).toBeCloseTo(0.5);
        });

        it('sets utilization to "0" when totalSupplied is zero', async () => {
            blockchain = makeBlockchainClient([{ ...MOCK_MARKET, totalSupplied: 0n, totalBorrowed: 0n }]);
            job = new SnapshotJob(blockchain, repo, dummyAddr, dummyAddr, dummyAbi);
            await job.takeSnapshot();
            const saved = vi.mocked(repo.saveSnapshot).mock.calls[0][0];
            expect(saved.utilization).toBe('0');
        });

        it('handles multiple markets in a single snapshot', async () => {
            const weth = { ...MOCK_MARKET, asset: '0xweth', symbol: 'WETH' };
            blockchain = makeBlockchainClient([MOCK_MARKET, weth]);
            job = new SnapshotJob(blockchain, repo, dummyAddr, dummyAddr, dummyAbi);
            await job.takeSnapshot();
            expect(repo.saveSnapshot).toHaveBeenCalledTimes(2);
        });
    });

    describe('start / stop', () => {
        it('fires an initial snapshot immediately on start', async () => {
            job.start();
            // Flush promises queued by start() without triggering the interval
            await vi.advanceTimersByTimeAsync(0);
            expect(repo.saveSnapshot).toHaveBeenCalled();
            job.stop();
        });

        it('stop clears the interval so no further snapshots fire after stop', async () => {
            job.start();
            // Allow initial snapshot to complete
            await vi.advanceTimersByTimeAsync(0);
            const callsAfterStart = vi.mocked(repo.saveSnapshot).mock.calls.length;
            job.stop();
            // Advance well past one interval — no additional calls expected
            await vi.advanceTimersByTimeAsync(120_000);
            expect(vi.mocked(repo.saveSnapshot).mock.calls.length).toBe(callsAfterStart);
        });
    });
});
