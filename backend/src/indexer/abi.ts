// LendingPool event ABIs for indexing
export const LENDING_POOL_EVENTS = [
    {
        type: 'event',
        name: 'Supply',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'Withdraw',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'Borrow',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'Repay',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'Liquidate',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'liquidator', type: 'address', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'ReserveUsedAsCollateralEnabled',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'ReserveUsedAsCollateralDisabled',
        inputs: [
            { name: 'asset', type: 'address', indexed: true },
            { name: 'user', type: 'address', indexed: true },
        ],
    },
] as const;

export const UI_POOL_DATA_PROVIDER_ABI = [
    {
        name: 'getMarketData',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'pool', type: 'address' }],
        outputs: [
            {
                name: '',
                type: 'tuple[]',
                components: [
                    { name: 'asset', type: 'address' },
                    { name: 'symbol', type: 'string' },
                    { name: 'decimals', type: 'uint8' },
                    { name: 'ltv', type: 'uint256' },
                    { name: 'liqThreshold', type: 'uint256' },
                    { name: 'supplyRate', type: 'uint256' },
                    { name: 'borrowRate', type: 'uint256' },
                    { name: 'totalSupplied', type: 'uint256' },
                    { name: 'totalBorrowed', type: 'uint256' },
                    { name: 'availableLiquidity', type: 'uint256' },
                    { name: 'priceUsd', type: 'uint256' },
                ],
            },
        ],
    },
] as const;
