import { publicClient } from '../lib/viem.js';
import { config } from '../config/index.js';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { LENDING_POOL_EVENTS } from './abi.js';
import { processEvent } from './processor.js';
import { startSnapshotJob, stopSnapshotJob } from './snapshots.js';
import { decodeEventLog, type Log } from 'viem';

const BATCH_SIZE = 1000n;

export class EventIndexer {
    private isRunning = false;
    private unwatch: (() => void) | null = null;

    async start(): Promise<void> {
        if (!config.lendingPoolAddress) {
            console.warn('[Indexer] LendingPool address not configured, skipping indexer');
            return;
        }

        this.isRunning = true;
        console.log(`[Indexer] Starting indexer for LendingPool at ${config.lendingPoolAddress}`);

        // Backfill from last checkpoint
        await this.backfill();

        // Start live event watching
        this.watchLive();

        // Start market snapshot job
        startSnapshotJob();
    }

    async stop(): Promise<void> {
        this.isRunning = false;
        if (this.unwatch) {
            this.unwatch();
            this.unwatch = null;
        }
        stopSnapshotJob();
        console.log('[Indexer] Stopped');
    }

    private async getLastProcessedBlock(): Promise<bigint> {
        const state = await db.query.indexerState.findFirst({
            where: eq(schema.indexerState.chainId, config.chainId),
        });
        return state?.lastProcessedBlock ?? 0n;
    }

    private async saveCheckpoint(blockNumber: bigint): Promise<void> {
        const existing = await db.query.indexerState.findFirst({
            where: eq(schema.indexerState.chainId, config.chainId),
        });

        if (existing) {
            await db
                .update(schema.indexerState)
                .set({ lastProcessedBlock: blockNumber, updatedAt: new Date() })
                .where(eq(schema.indexerState.id, existing.id));
        } else {
            await db.insert(schema.indexerState).values({
                chainId: config.chainId,
                lastProcessedBlock: blockNumber,
            });
        }
    }

    private async backfill(): Promise<void> {
        const lastBlock = await this.getLastProcessedBlock();
        const currentBlock = await publicClient.getBlockNumber();

        if (lastBlock >= currentBlock) {
            console.log('[Indexer] Already up to date');
            return;
        }

        console.log(`[Indexer] Backfilling from block ${lastBlock + 1n} to ${currentBlock}`);

        let fromBlock = lastBlock + 1n;

        while (fromBlock <= currentBlock && this.isRunning) {
            const toBlock = fromBlock + BATCH_SIZE > currentBlock
                ? currentBlock
                : fromBlock + BATCH_SIZE;

            const logs = await publicClient.getLogs({
                address: config.lendingPoolAddress!,
                fromBlock,
                toBlock,
            });

            for (const log of logs) {
                await this.processLog(log);
            }

            await this.saveCheckpoint(toBlock);
            console.log(`[Indexer] Processed blocks ${fromBlock}-${toBlock} (${logs.length} events)`);
            fromBlock = toBlock + 1n;
        }
    }

    private watchLive(): void {
        this.unwatch = publicClient.watchContractEvent({
            address: config.lendingPoolAddress!,
            abi: LENDING_POOL_EVENTS,
            onLogs: async (logs) => {
                for (const log of logs) {
                    try {
                        await processEvent({
                            eventName: log.eventName,
                            args: log.args as Record<string, unknown>,
                            log: log as unknown as Log,
                        });

                        if (log.blockNumber) {
                            await this.saveCheckpoint(log.blockNumber);
                        }
                    } catch (err) {
                        console.error('[Indexer] Error processing live event:', err);
                    }
                }
            },
            onError: (error) => {
                console.error('[Indexer] Watch error:', error);
            },
        });

        console.log('[Indexer] Live event watching started');
    }

    private async processLog(log: Log): Promise<void> {
        try {
            const decoded = decodeEventLog({
                abi: LENDING_POOL_EVENTS,
                data: log.data,
                topics: log.topics,
            });

            await processEvent({
                eventName: decoded.eventName,
                args: decoded.args as Record<string, unknown>,
                log,
            });
        } catch {
            // Skip logs that don't match our ABI (e.g. Transfer events from qToken)
        }
    }
}
