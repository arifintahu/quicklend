import { pgTable, serial, varchar, numeric, boolean, timestamp, integer, text, index, bigint } from 'drizzle-orm/pg-core';

// Indexed events from the blockchain
export const events = pgTable('events', {
    id: serial('id').primaryKey(),
    txHash: varchar('tx_hash', { length: 66 }).notNull(),
    blockNumber: bigint('block_number', { mode: 'bigint' }).notNull(),
    logIndex: integer('log_index').notNull(),
    eventName: varchar('event_name', { length: 50 }).notNull(),
    userAddress: varchar('user_address', { length: 42 }),
    asset: varchar('asset', { length: 42 }),
    amount: numeric('amount', { precision: 78, scale: 0 }),
    data: text('data'), // JSON stringified additional data
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('events_user_idx').on(table.userAddress),
    index('events_asset_idx').on(table.asset),
    index('events_block_idx').on(table.blockNumber),
    index('events_name_idx').on(table.eventName),
]);

// Materialized user positions
export const userPositions = pgTable('user_positions', {
    id: serial('id').primaryKey(),
    userAddress: varchar('user_address', { length: 42 }).notNull(),
    asset: varchar('asset', { length: 42 }).notNull(),
    symbol: varchar('symbol', { length: 20 }),
    suppliedBalance: numeric('supplied_balance', { precision: 78, scale: 0 }).default('0'),
    borrowedBalance: numeric('borrowed_balance', { precision: 78, scale: 0 }).default('0'),
    isCollateral: boolean('is_collateral').default(true),
    healthFactor: numeric('health_factor', { precision: 20, scale: 18 }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('positions_user_idx').on(table.userAddress),
    index('positions_asset_idx').on(table.asset),
]);

// Market snapshots for historical data
export const marketSnapshots = pgTable('market_snapshots', {
    id: serial('id').primaryKey(),
    asset: varchar('asset', { length: 42 }).notNull(),
    symbol: varchar('symbol', { length: 20 }),
    totalSupplied: numeric('total_supplied', { precision: 78, scale: 0 }),
    totalBorrowed: numeric('total_borrowed', { precision: 78, scale: 0 }),
    supplyRate: numeric('supply_rate', { precision: 20, scale: 18 }),
    borrowRate: numeric('borrow_rate', { precision: 20, scale: 18 }),
    utilization: numeric('utilization', { precision: 20, scale: 18 }),
    priceUsd: numeric('price_usd', { precision: 30, scale: 18 }),
    snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),
}, (table) => [
    index('snapshots_asset_idx').on(table.asset),
    index('snapshots_time_idx').on(table.snapshotAt),
]);

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
    id: serial('id').primaryKey(),
    userAddress: varchar('user_address', { length: 42 }).notNull().unique(),
    telegramChatId: varchar('telegram_chat_id', { length: 50 }),
    email: varchar('email', { length: 255 }),
    healthFactorThreshold: numeric('health_factor_threshold', { precision: 5, scale: 2 }).default('1.2'),
    enableLiquidationAlerts: boolean('enable_liquidation_alerts').default(true),
    enableSupplyBorrowAlerts: boolean('enable_supply_borrow_alerts').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Indexer state tracking
export const indexerState = pgTable('indexer_state', {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull().unique(),
    lastProcessedBlock: bigint('last_processed_block', { mode: 'bigint' }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Liquidation logs
export const liquidationLogs = pgTable('liquidation_logs', {
    id: serial('id').primaryKey(),
    txHash: varchar('tx_hash', { length: 66 }).notNull(),
    liquidator: varchar('liquidator', { length: 42 }).notNull(),
    userLiquidated: varchar('user_liquidated', { length: 42 }).notNull(),
    collateralAsset: varchar('collateral_asset', { length: 42 }).notNull(),
    debtAsset: varchar('debt_asset', { length: 42 }).notNull(),
    debtCovered: numeric('debt_covered', { precision: 78, scale: 0 }),
    collateralSeized: numeric('collateral_seized', { precision: 78, scale: 0 }),
    profitUsd: numeric('profit_usd', { precision: 30, scale: 18 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('liquidations_user_idx').on(table.userLiquidated),
    index('liquidations_time_idx').on(table.createdAt),
]);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type UserPosition = typeof userPositions.$inferSelect;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type IndexerState = typeof indexerState.$inferSelect;
export type LiquidationLog = typeof liquidationLogs.$inferSelect;
