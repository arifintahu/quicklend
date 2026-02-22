import { db, schema } from '../db/index.js';
import type { IEventProcessor, DecodedEvent } from './interfaces/IEventProcessor.js';
import type { IEventRepository } from '../repositories/interfaces/IEventRepository.js';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js';

/**
 * Concrete event processor that persists decoded blockchain events to the
 * database and updates materialized user position state.
 * Implements IEventProcessor — can be swapped with a no-op or mock in tests.
 */
export class EventProcessor implements IEventProcessor {
    constructor(
        private readonly eventRepository: IEventRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async process(event: DecodedEvent): Promise<void> {
        const { eventName, args, log } = event;
        const txHash = log.transactionHash ?? '';
        const blockNumber = log.blockNumber ?? 0n;
        const logIndex = log.logIndex ?? 0;

        const userAddress = ((args.user as string) ?? '').toLowerCase();
        const asset = ((args.asset as string) ?? '').toLowerCase();
        const amount = args.amount ? (args.amount as bigint).toString() : null;

        await this.eventRepository.insertEvent({
            txHash,
            blockNumber,
            logIndex,
            eventName,
            userAddress: userAddress || null,
            asset: asset || null,
            amount,
            data: JSON.stringify(args, (_key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ),
        });

        switch (eventName) {
            case 'Supply':
                await this.userRepository.upsertPosition(userAddress, asset, {
                    suppliedDelta: BigInt(amount ?? '0'),
                });
                break;

            case 'Withdraw':
                await this.userRepository.upsertPosition(userAddress, asset, {
                    suppliedDelta: -BigInt(amount ?? '0'),
                });
                break;

            case 'Borrow':
                await this.userRepository.upsertPosition(userAddress, asset, {
                    borrowedDelta: BigInt(amount ?? '0'),
                });
                break;

            case 'Repay':
                await this.userRepository.upsertPosition(userAddress, asset, {
                    borrowedDelta: -BigInt(amount ?? '0'),
                });
                break;

            case 'Liquidate': {
                const liquidator = ((args.liquidator as string) ?? '').toLowerCase();
                await db.insert(schema.liquidationLogs).values({
                    txHash,
                    liquidator,
                    userLiquidated: userAddress,
                    collateralAsset: asset,
                    debtAsset: asset,
                    debtCovered: amount,
                    collateralSeized: amount,
                });
                await this.userRepository.upsertPosition(userAddress, asset, {
                    suppliedDelta: -BigInt(amount ?? '0'),
                });
                break;
            }

            case 'ReserveUsedAsCollateralEnabled':
                await this.userRepository.upsertPosition(userAddress, asset, { isCollateral: true });
                break;

            case 'ReserveUsedAsCollateralDisabled':
                await this.userRepository.upsertPosition(userAddress, asset, { isCollateral: false });
                break;
        }
    }
}

// Legacy functional export kept for backward compatibility
export async function processEvent(event: DecodedEvent): Promise<void> {
    const { EventRepository } = await import('../repositories/EventRepository.js');
    const { UserRepository } = await import('../repositories/UserRepository.js');
    const processor = new EventProcessor(new EventRepository(), new UserRepository());
    return processor.process(event);
}
