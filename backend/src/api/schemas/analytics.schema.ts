import { Type } from '@sinclair/typebox';

export const DaysQuerySchema = Type.Object({
    days: Type.Optional(Type.Number({
        minimum: 1,
        maximum: 365,
        default: 30,
        description: 'Number of days to look back',
    })),
});

export const TvlResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Object({
        total: Type.Number({ description: 'Total Value Locked in USD' }),
        byAsset: Type.Record(Type.String(), Type.Number(), { description: 'TVL per asset symbol' }),
    }),
    timestamp: Type.String(),
});

export const TvlHistoryResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(Type.Object({
        date: Type.String({ description: 'ISO date (YYYY-MM-DD)' }),
        tvl: Type.Number({ description: 'Total Value Locked in USD at that date' }),
    })),
});

export const LiquidationSchema = Type.Object({
    txHash: Type.String(),
    liquidator: Type.String({ description: 'Address that performed the liquidation' }),
    userLiquidated: Type.String({ description: 'Address whose position was liquidated' }),
    collateralAsset: Type.String(),
    debtAsset: Type.String(),
    debtCovered: Type.Union([Type.String(), Type.Null()]),
    collateralSeized: Type.Union([Type.String(), Type.Null()]),
    profitUsd: Type.Union([Type.String(), Type.Null()]),
    timestamp: Type.Any(),
});

export const LiquidationsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(LiquidationSchema),
});
