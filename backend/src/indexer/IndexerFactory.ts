import type { IEventProcessor } from './interfaces/IEventProcessor.js';
import type { ISnapshotJob } from './interfaces/ISnapshotJob.js';
import type { IRepositoryFactory } from '../repositories/interfaces/IRepositoryFactory.js';
import type { ISnapshotBlockchainClient } from './snapshots.js';
import { EventProcessor } from './processor.js';
import { SnapshotJob } from './snapshots.js';
import { UI_POOL_DATA_PROVIDER_ABI } from './abi.js';

/**
 * Factory that assembles indexer components with their required dependencies.
 * Applies the Abstract Factory pattern to the blockchain-indexing subsystem:
 * EventProcessor and SnapshotJob are produced as a coherent family sharing
 * the same IRepositoryFactory backend.
 */
export class IndexerFactory {
    constructor(private readonly repositoryFactory: IRepositoryFactory) {}

    createEventProcessor(): IEventProcessor {
        return new EventProcessor(
            this.repositoryFactory.createEventRepository(),
            this.repositoryFactory.createUserRepository()
        );
    }

    createSnapshotJob(
        blockchainClient: ISnapshotBlockchainClient,
        uiDataProviderAddress: `0x${string}`,
        lendingPoolAddress: `0x${string}`,
        intervalMs?: number
    ): ISnapshotJob {
        return new SnapshotJob(
            blockchainClient,
            this.repositoryFactory.createMarketRepository(),
            uiDataProviderAddress,
            lendingPoolAddress,
            UI_POOL_DATA_PROVIDER_ABI,
            intervalMs
        );
    }
}
