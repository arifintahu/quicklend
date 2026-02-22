import { Type } from '@sinclair/typebox';

export const AddressParamsSchema = Type.Object({
    address: Type.String({
        pattern: '^0x[a-fA-F0-9]{40}$',
        description: 'Ethereum wallet address (hex, 20 bytes)',
    }),
});

export const PaginationQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number (1-based)' })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Results per page (max 100)' })),
});

export const UserPositionSchema = Type.Object({
    asset: Type.String({ description: 'Token contract address' }),
    symbol: Type.String({ description: 'Token symbol' }),
    suppliedBalance: Type.String({ description: 'Raw supplied balance (wei)' }),
    borrowedBalance: Type.String({ description: 'Raw borrowed balance (wei)' }),
    isCollateral: Type.Boolean({ description: 'Whether this asset is used as collateral' }),
});

export const UserPositionsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(UserPositionSchema),
});

export const HealthFactorResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Object({
        healthFactor: Type.Number({ description: 'Health factor value (< 1 = liquidatable)' }),
        status: Type.Union([
            Type.Literal('safe'),
            Type.Literal('warning'),
            Type.Literal('danger'),
            Type.Literal('unknown'),
        ], { description: 'safe ≥ 1.5, warning ≥ 1.2, danger < 1.2' }),
    }),
});

export const TransactionSchema = Type.Object({
    txHash: Type.Union([Type.String(), Type.Null()]),
    blockNumber: Type.Optional(Type.String()),
    eventName: Type.String(),
    asset: Type.Union([Type.String(), Type.Null()]),
    amount: Type.Union([Type.String(), Type.Null()]),
    timestamp: Type.Any(),
});

export const UserHistoryResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(TransactionSchema),
    pagination: Type.Object({
        page: Type.Number(),
        limit: Type.Number(),
    }),
});
