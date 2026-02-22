import { formatUnits } from 'viem';
import type { IMarketsService, FormattedMarket } from './interfaces/IMarketsService.js';

interface RawMarket {
    asset: string;
    symbol: string;
    decimals: number;
    ltv: bigint;
    liqThreshold: bigint;
    supplyRate: bigint;
    borrowRate: bigint;
    totalSupplied: bigint;
    totalBorrowed: bigint;
    availableLiquidity: bigint;
    priceUsd: bigint;
}

export interface IBlockchainClient {
    readContract(params: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args: unknown[];
    }): Promise<unknown>;
}

export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

export interface MarketsServiceConfig {
    lendingPoolAddress?: `0x${string}`;
    uiDataProviderAddress?: `0x${string}`;
    uiDataProviderAbi: readonly unknown[];
    cacheKey: string;
    cacheTtl: number;
}

export class MarketsService implements IMarketsService {
    constructor(
        private readonly blockchainClient: IBlockchainClient,
        private readonly cache: ICacheService,
        private readonly cfg: MarketsServiceConfig
    ) {}

    async getAllMarkets(): Promise<FormattedMarket[]> {
        if (!this.cfg.lendingPoolAddress || !this.cfg.uiDataProviderAddress) {
            return [];
        }

        const cached = await this.cache.get<FormattedMarket[]>(this.cfg.cacheKey);
        if (cached) return cached;

        const data = await this.blockchainClient.readContract({
            address: this.cfg.uiDataProviderAddress,
            abi: this.cfg.uiDataProviderAbi,
            functionName: 'getMarketData',
            args: [this.cfg.lendingPoolAddress],
        });

        const result = this.formatMarkets(data as RawMarket[]);
        await this.cache.set(this.cfg.cacheKey, result, this.cfg.cacheTtl);
        return result;
    }

    async getMarketByAsset(asset: string): Promise<FormattedMarket | null> {
        const markets = await this.getAllMarkets();
        return markets.find((m) => m.asset.toLowerCase() === asset.toLowerCase()) ?? null;
    }

    private formatMarkets(raw: RawMarket[]): FormattedMarket[] {
        return raw.map((m) => ({
            asset: m.asset,
            symbol: m.symbol,
            decimals: m.decimals,
            ltv: formatUnits(m.ltv, 18),
            liqThreshold: formatUnits(m.liqThreshold, 18),
            supplyAPY: formatUnits(m.supplyRate, 18),
            borrowAPY: formatUnits(m.borrowRate, 18),
            totalSupplied: formatUnits(m.totalSupplied, m.decimals),
            totalBorrowed: formatUnits(m.totalBorrowed, m.decimals),
            availableLiquidity: formatUnits(m.availableLiquidity, m.decimals),
            priceUsd: formatUnits(m.priceUsd, 18),
        }));
    }
}
