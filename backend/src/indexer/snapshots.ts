import { formatUnits } from 'viem';
import type { ISnapshotJob } from './interfaces/ISnapshotJob.js';
import type { IMarketRepository } from '../repositories/interfaces/IMarketRepository.js';

export interface ISnapshotBlockchainClient {
    readContract(params: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args: unknown[];
    }): Promise<unknown>;
}

interface RawMarketData {
    asset: string;
    symbol: string;
    decimals: number;
    supplyRate: bigint;
    borrowRate: bigint;
    totalSupplied: bigint;
    totalBorrowed: bigint;
    priceUsd: bigint;
}

/**
 * Concrete snapshot job that periodically reads on-chain market data and
 * persists it via IMarketRepository. Fully injectable for testing.
 */
export class SnapshotJob implements ISnapshotJob {
    private intervalHandle: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly blockchainClient: ISnapshotBlockchainClient,
        private readonly marketRepository: IMarketRepository,
        private readonly uiDataProviderAddress: `0x${string}`,
        private readonly lendingPoolAddress: `0x${string}`,
        private readonly uiDataProviderAbi: readonly unknown[],
        private readonly intervalMs = 60_000
    ) {}

    start(): void {
        console.log('[Snapshots] Starting periodic market snapshot job');
        this.takeSnapshot().catch((err) =>
            console.error('[Snapshots] Initial snapshot failed:', err)
        );
        this.intervalHandle = setInterval(() => {
            this.takeSnapshot().catch((err) =>
                console.error('[Snapshots] Snapshot failed:', err)
            );
        }, this.intervalMs);
    }

    stop(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }

    async takeSnapshot(): Promise<void> {
        const data = await this.blockchainClient.readContract({
            address: this.uiDataProviderAddress,
            abi: this.uiDataProviderAbi,
            functionName: 'getMarketData',
            args: [this.lendingPoolAddress],
        });

        const markets = data as RawMarketData[];
        const now = new Date();

        for (const market of markets) {
            const totalSupplied = market.totalSupplied.toString();
            const totalBorrowed = market.totalBorrowed.toString();
            const supplyRate = formatUnits(market.supplyRate, 18);
            const borrowRate = formatUnits(market.borrowRate, 18);
            const priceUsd = formatUnits(market.priceUsd, 18);
            const totalSuppliedNum = Number(formatUnits(market.totalSupplied, market.decimals));
            const totalBorrowedNum = Number(formatUnits(market.totalBorrowed, market.decimals));
            const utilization = totalSuppliedNum > 0
                ? (totalBorrowedNum / totalSuppliedNum).toString()
                : '0';

            await this.marketRepository.saveSnapshot({
                asset: market.asset.toLowerCase(),
                symbol: market.symbol,
                totalSupplied,
                totalBorrowed,
                supplyRate,
                borrowRate,
                utilization,
                priceUsd,
                snapshotAt: now,
            });
        }

        console.log(`[Snapshots] Saved snapshot for ${markets.length} markets`);
    }
}

// Legacy functional exports kept for backward compatibility with indexer.ts
let legacyJob: SnapshotJob | null = null;

export async function startSnapshotJob(): Promise<void> {
    const { config } = await import('../config/index.js');
    const { UI_POOL_DATA_PROVIDER_ABI } = await import('./abi.js');
    const { publicClient } = await import('../lib/viem.js');
    const { MarketRepository } = await import('../repositories/MarketRepository.js');

    if (!config.uiDataProviderAddress || !config.lendingPoolAddress) {
        console.warn('[Snapshots] Contracts not configured, skipping snapshot job');
        return;
    }

    legacyJob = new SnapshotJob(
        publicClient,
        new MarketRepository(),
        config.uiDataProviderAddress,
        config.lendingPoolAddress,
        UI_POOL_DATA_PROVIDER_ABI
    );
    legacyJob.start();
}

export function stopSnapshotJob(): void {
    legacyJob?.stop();
    legacyJob = null;
}
