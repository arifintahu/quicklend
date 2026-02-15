import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import type { Log } from 'viem';

interface DecodedEvent {
    eventName: string;
    args: Record<string, unknown>;
    log: Log;
}

export async function processEvent(event: DecodedEvent): Promise<void> {
    const { eventName, args, log } = event;
    const txHash = log.transactionHash ?? '';
    const blockNumber = log.blockNumber ?? 0n;
    const logIndex = log.logIndex ?? 0;

    // Insert into events table
    const userAddress = ((args.user as string) ?? '').toLowerCase();
    const asset = ((args.asset as string) ?? '').toLowerCase();
    const amount = args.amount ? (args.amount as bigint).toString() : null;

    await db.insert(schema.events).values({
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

    // Process based on event type
    switch (eventName) {
        case 'Supply':
            await upsertPosition(userAddress, asset, {
                suppliedDelta: BigInt(amount ?? '0'),
            });
            break;

        case 'Withdraw':
            await upsertPosition(userAddress, asset, {
                suppliedDelta: -BigInt(amount ?? '0'),
            });
            break;

        case 'Borrow':
            await upsertPosition(userAddress, asset, {
                borrowedDelta: BigInt(amount ?? '0'),
            });
            break;

        case 'Repay':
            await upsertPosition(userAddress, asset, {
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
            // Reduce user's supplied balance (collateral seized)
            await upsertPosition(userAddress, asset, {
                suppliedDelta: -BigInt(amount ?? '0'),
            });
            break;
        }

        case 'ReserveUsedAsCollateralEnabled':
            await upsertPosition(userAddress, asset, { isCollateral: true });
            break;

        case 'ReserveUsedAsCollateralDisabled':
            await upsertPosition(userAddress, asset, { isCollateral: false });
            break;
    }
}

interface PositionUpdate {
    suppliedDelta?: bigint;
    borrowedDelta?: bigint;
    isCollateral?: boolean;
}

async function upsertPosition(
    userAddress: string,
    asset: string,
    update: PositionUpdate
): Promise<void> {
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
