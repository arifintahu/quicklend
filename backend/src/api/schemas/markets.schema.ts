import { Type } from '@sinclair/typebox';

export const MarketSchema = Type.Object({
    asset: Type.String({ description: 'ERC-20 token contract address' }),
    symbol: Type.String({ description: 'Token symbol (e.g. USDC)' }),
    decimals: Type.Number({ description: 'Token decimals' }),
    ltv: Type.String({ description: 'Loan-to-value ratio (18-decimal string)' }),
    liqThreshold: Type.String({ description: 'Liquidation threshold (18-decimal string)' }),
    supplyAPY: Type.String({ description: 'Current supply APY (18-decimal string)' }),
    borrowAPY: Type.String({ description: 'Current borrow APY (18-decimal string)' }),
    totalSupplied: Type.String({ description: 'Total tokens supplied' }),
    totalBorrowed: Type.String({ description: 'Total tokens borrowed' }),
    availableLiquidity: Type.String({ description: 'Available liquidity' }),
    priceUsd: Type.String({ description: 'Current USD price (18-decimal string)' }),
});

export const MarketsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: Type.Array(MarketSchema),
    timestamp: Type.String(),
});

export const MarketResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: MarketSchema,
    timestamp: Type.String(),
});

export const AssetParamsSchema = Type.Object({
    asset: Type.String({
        pattern: '^0x[a-fA-F0-9]{40}$',
        description: 'ERC-20 token contract address (hex, 20 bytes)',
    }),
});
