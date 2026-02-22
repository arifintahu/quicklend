import type { UserPosition, Event } from '../../db/schema.js';

export interface PositionUpdate {
    suppliedDelta?: bigint;
    borrowedDelta?: bigint;
    isCollateral?: boolean;
}

export interface IUserRepository {
    findPositionsByAddress(address: string): Promise<UserPosition[]>;
    findFirstPositionByAddress(address: string): Promise<UserPosition | undefined>;
    findEventsByAddress(address: string, limit: number, offset: number): Promise<Event[]>;
    upsertPosition(userAddress: string, asset: string, update: PositionUpdate): Promise<void>;
}
