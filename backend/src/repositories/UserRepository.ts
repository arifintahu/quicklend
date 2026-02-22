import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import type { IUserRepository, PositionUpdate } from './interfaces/IUserRepository.js';
import type { UserPosition, Event } from '../db/schema.js';

export class UserRepository implements IUserRepository {
    async findPositionsByAddress(address: string): Promise<UserPosition[]> {
        return db.query.userPositions.findMany({
            where: eq(schema.userPositions.userAddress, address.toLowerCase()),
        });
    }

    async findFirstPositionByAddress(address: string): Promise<UserPosition | undefined> {
        return db.query.userPositions.findFirst({
            where: eq(schema.userPositions.userAddress, address.toLowerCase()),
        });
    }

    async findEventsByAddress(address: string, limit: number, offset: number): Promise<Event[]> {
        return db.query.events.findMany({
            where: eq(schema.events.userAddress, address.toLowerCase()),
            orderBy: (events, { desc }) => [desc(events.blockNumber)],
            limit,
            offset,
        });
    }

    async upsertPosition(userAddress: string, asset: string, update: PositionUpdate): Promise<void> {
        const existing = await db.query.userPositions.findFirst({
            where: and(
                eq(schema.userPositions.userAddress, userAddress),
                eq(schema.userPositions.asset, asset)
            ),
        });

        if (existing) {
            const currentSupplied = BigInt(existing.suppliedBalance ?? '0');
            const currentBorrowed = BigInt(existing.borrowedBalance ?? '0');

            const newSupplied = update.suppliedDelta !== undefined
                ? (currentSupplied + update.suppliedDelta).toString()
                : existing.suppliedBalance;

            const newBorrowed = update.borrowedDelta !== undefined
                ? (currentBorrowed + update.borrowedDelta).toString()
                : existing.borrowedBalance;

            await db
                .update(schema.userPositions)
                .set({
                    suppliedBalance: newSupplied,
                    borrowedBalance: newBorrowed,
                    ...(update.isCollateral !== undefined ? { isCollateral: update.isCollateral } : {}),
                    updatedAt: new Date(),
                })
                .where(eq(schema.userPositions.id, existing.id));
        } else {
            await db.insert(schema.userPositions).values({
                userAddress,
                asset,
                suppliedBalance: (update.suppliedDelta ?? 0n).toString(),
                borrowedBalance: (update.borrowedDelta ?? 0n).toString(),
                isCollateral: update.isCollateral ?? true,
            });
        }
    }
}
