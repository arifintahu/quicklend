import type { NewEvent, IndexerState } from '../../db/schema.js';

export interface IEventRepository {
    insertEvent(event: NewEvent): Promise<void>;
    findIndexerState(chainId: number): Promise<IndexerState | undefined>;
    saveIndexerState(chainId: number, blockNumber: bigint): Promise<void>;
}
