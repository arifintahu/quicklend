import 'dotenv/config';

// Server
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quicklend',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    // Blockchain
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    chainId: parseInt(process.env.CHAIN_ID || '31337', 10),

    // Contracts
    lendingPoolAddress: process.env.LENDING_POOL_ADDRESS as `0x${string}` | undefined,
    uiDataProviderAddress: process.env.UI_DATA_PROVIDER_ADDRESS as `0x${string}` | undefined,

    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

    // Rate Limiting
    rateLimit: {
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    },

    // Liquidation Bot
    liquidator: {
        privateKey: process.env.LIQUIDATOR_PRIVATE_KEY as `0x${string}` | undefined,
        minProfitUsd: parseFloat(process.env.MIN_PROFIT_USD || '10'),
    },
} as const;

export type Config = typeof config;
