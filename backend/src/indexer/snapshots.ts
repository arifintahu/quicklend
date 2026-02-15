import { publicClient } from '../lib/viem.js';
import { config } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { UI_POOL_DATA_PROVIDER_ABI } from './abi.js';
import { formatUnits } from 'viem';

let snapshotInterval: ReturnType<typeof setInterval> | null = null;

export function startSnapshotJob(): void {
    if (!config.uiDataProviderAddress || !config.lendingPoolAddress) {
        console.warn('[Snapshots] Contracts not configured, skipping snapshot job');
        return;
    }

    console.log('[Snapshots] Starting periodic market snapshot job (60s interval)');

    // Take an initial snapshot
    takeSnapshot().catch((err) => console.error('[Snapshots] Initial snapshot failed:', err));

    // Then every 60 seconds
    snapshotInterval = setInterval(() => {
        takeSnapshot().catch((err) => console.error('[Snapshots] Snapshot failed:', err));
    }, 60_000);
}

export function stopSnapshotJob(): void {
    if (snapshotInterval) {
        clearInterval(snapshotInterval);
        snapshotInterval = null;
    }
}

async function takeSnapshot(): Promise<void> {
    const data = await publicClient.readContract({
        address: config.uiDataProviderAddress!,
        abi: UI_POOL_DATA_PROVIDER_ABI,
        functionName: 'getMarketData',
        args: [config.lendingPoolAddress!],
    });

    const markets = data as unknown as Array<{
        asset: string;
        symbol: string;
        decimals: number;
        supplyRate: bigint;
        borrowRate: bigint;
        totalSupplied: bigint;
        totalBorrowed: bigint;
        availableLiquidity: bigint;
        priceUsd: bigint;
    }>;

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

        await db.insert(schema.marketSnapshots).values({
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
