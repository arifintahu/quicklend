import { getAddress } from 'viem';

// Contract ABIs - These must be extracted from the compiled contracts
// Run: forge build && copy out/LendingPool.sol/LendingPool.json to frontend/src/lib/abi/

export const LENDING_POOL_ABI = [
    // View functions
    {
        name: 'getUserHealthFactor',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'getMarketList',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address[]' }],
    },
    {
        name: 'markets',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'asset', type: 'address' }],
        outputs: [
            { name: 'isListed', type: 'bool' },
            { name: 'ltv', type: 'uint256' },
            { name: 'liqThreshold', type: 'uint256' },
            { name: 'liqBonus', type: 'uint256' },
            { name: 'interestRateModel', type: 'address' },
            { name: 'qTokenAddress', type: 'address' },
            { name: 'totalSupplied', type: 'uint256' },
            { name: 'totalBorrowed', type: 'uint256' },
            { name: 'borrowIndex', type: 'uint256' },
            { name: 'lastUpdateTimestamp', type: 'uint256' },
        ],
    },
    {
        name: 'userBorrowShares',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'user', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'userCollateralEnabled',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'user', type: 'address' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    // Write functions
    {
        name: 'supply',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'borrow',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'repay',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        name: 'setUserUseReserveAsCollateral',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'asset', type: 'address' },
            { name: 'useAsCollateral', type: 'bool' },
        ],
        outputs: [],
    },
    {
        name: 'liquidate',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assetCollateral', type: 'address' },
            { name: 'assetBorrow', type: 'address' },
            { name: 'user', type: 'address' },
            { name: 'debtToCover', type: 'uint256' },
        ],
        outputs: [],
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
    {
        name: 'getUserData',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'pool', type: 'address' },
            { name: 'user', type: 'address' },
        ],
        outputs: [
            {
                name: '',
                type: 'tuple[]',
                components: [
                    { name: 'asset', type: 'address' },
                    { name: 'symbol', type: 'string' },
                    { name: 'suppliedBalance', type: 'uint256' },
                    { name: 'borrowedBalance', type: 'uint256' },
                    { name: 'isCollateral', type: 'bool' },
                ],
            },
        ],
    },
] as const;

export const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
] as const;

// Contract addresses - Update these after deployment
// For local Anvil development, these get logged after running Deploy.s.sol
export const getContractAddresses = () => {
    const lendingPool = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS;
    const uiDataProvider = process.env.NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS;

    if (!lendingPool || !uiDataProvider) {
        console.warn('Contract addresses not set. Please deploy contracts and update .env.local');
        return null;
    }

    return {
        lendingPool: getAddress(lendingPool),
        uiDataProvider: getAddress(uiDataProvider),
    };
};

export const contracts = {
    lendingPool: {
        address: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS as `0x${string}` | undefined,
        abi: LENDING_POOL_ABI,
    },
    uiDataProvider: {
        address: process.env.NEXT_PUBLIC_UI_DATA_PROVIDER_ADDRESS as `0x${string}` | undefined,
        abi: UI_POOL_DATA_PROVIDER_ABI,
    },
} as const;
