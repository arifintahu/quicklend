import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketsService } from '../../services/MarketsService.js';
import type { IBlockchainClient, ICacheService, MarketsServiceConfig } from '../../services/MarketsService.js';

const RAW_MARKETS = [
    {
        asset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        ltv: BigInt('800000000000000000'),          // 0.8
        liqThreshold: BigInt('850000000000000000'),  // 0.85
        supplyRate: BigInt('50000000000000000'),     // 0.05 = 5%
        borrowRate: BigInt('100000000000000000'),    // 0.10 = 10%
        totalSupplied: BigInt('1000000000'),         // 1000 USDC (6 decimals)
        totalBorrowed: BigInt('500000000'),          // 500 USDC
        availableLiquidity: BigInt('500000000'),     // 500 USDC
        priceUsd: BigInt('1000000000000000000'),     // $1
    },
];

function makeBlockchainClient(returnValue: unknown = RAW_MARKETS): IBlockchainClient {
    return { readContract: vi.fn().mockResolvedValue(returnValue) };
}

function makeCacheService(hit: unknown = null): ICacheService {
    return {
        get: vi.fn().mockResolvedValue(hit),
        set: vi.fn().mockResolvedValue(undefined),
    };
}

function makeConfig(overrides?: Partial<MarketsServiceConfig>): MarketsServiceConfig {
    return {
        lendingPoolAddress: '0x1111111111111111111111111111111111111111',
        uiDataProviderAddress: '0x2222222222222222222222222222222222222222',
        uiDataProviderAbi: [],
        cacheKey: 'markets:all',
        cacheTtl: 30,
        ...overrides,
    };
}

describe('MarketsService', () => {
    let blockchain: IBlockchainClient;
    let cache: ICacheService;
    let service: MarketsService;

    beforeEach(() => {
        blockchain = makeBlockchainClient();
        cache = makeCacheService();
        service = new MarketsService(blockchain, cache, makeConfig());
    });

    describe('getAllMarkets', () => {
        it('returns empty array when contract addresses are missing', async () => {
            const s = new MarketsService(blockchain, cache, makeConfig({
                lendingPoolAddress: undefined,
                uiDataProviderAddress: undefined,
            }));
            const result = await s.getAllMarkets();
            expect(result).toEqual([]);
        });

        it('returns cached data without calling the blockchain', async () => {
            const cached = [{ asset: '0xcached', symbol: 'CACHED' }];
            const cachedCache = makeCacheService(cached);
            const s = new MarketsService(blockchain, cachedCache, makeConfig());
            const result = await s.getAllMarkets();
            expect(result).toEqual(cached);
            expect(blockchain.readContract).not.toHaveBeenCalled();
        });

        it('fetches from blockchain on cache miss and caches the result', async () => {
            const result = await service.getAllMarkets();
            expect(blockchain.readContract).toHaveBeenCalledOnce();
            expect(cache.set).toHaveBeenCalledWith('markets:all', result, 30);
        });

        it('formats market fields correctly', async () => {
            const [market] = await service.getAllMarkets();
            expect(market.symbol).toBe('USDC');
            expect(market.decimals).toBe(6);
            expect(market.supplyAPY).toBe('0.05');
            expect(market.borrowAPY).toBe('0.1');
            expect(market.ltv).toBe('0.8');
            expect(market.liqThreshold).toBe('0.85');
            expect(market.priceUsd).toBe('1');
            // 1000 USDC in 6-decimal units
            expect(market.totalSupplied).toBe('1000');
            expect(market.totalBorrowed).toBe('500');
        });
    });

    describe('getMarketByAsset', () => {
        it('returns the matching market case-insensitively', async () => {
            const result = await service.getMarketByAsset(RAW_MARKETS[0].asset.toUpperCase());
            expect(result).not.toBeNull();
            expect(result!.symbol).toBe('USDC');
        });

        it('returns null when the asset is not found', async () => {
            const result = await service.getMarketByAsset('0x0000000000000000000000000000000000000000');
            expect(result).toBeNull();
        });
    });
});
