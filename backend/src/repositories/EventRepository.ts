import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import type { IEventRepository } from './interfaces/IEventRepository.js';
import type { NewEvent, IndexerState } from '../db/schema.js';

export class EventRepository implements IEventRepository {
    async insertEvent(event: NewEvent): Promise<void> {
        await db.insert(schema.events).values(event);
    }

    async findIndexerState(chainId: number): Promise<IndexerState | undefined> {
        return db.query.indexerState.findFirst({
            where: eq(schema.indexerState.chainId, chainId),
        });
    }

    async saveIndexerState(chainId: number, blockNumber: bigint): Promise<void> {
        const existing = await this.findIndexerState(chainId);

        if (existing) {
            await db
                .update(schema.indexerState)
                .set({ lastProcessedBlock: blockNumber, updatedAt: new Date() })
                .where(eq(schema.indexerState.id, existing.id));
        } else {
            await db.insert(schema.indexerState).values({
                chainId,
                lastProcessedBlock: blockNumber,
            });
        }
    }
}
