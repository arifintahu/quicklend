import type { IServiceFactory } from './interfaces/IServiceFactory.js';
import type { IHealthService } from './interfaces/IHealthService.js';
import type { IMarketsService } from './interfaces/IMarketsService.js';
import type { IUsersService } from './interfaces/IUsersService.js';
import type { IAnalyticsService } from './interfaces/IAnalyticsService.js';
import type { IRepositoryFactory } from '../repositories/interfaces/IRepositoryFactory.js';
import { HealthService } from './HealthService.js';
import { MarketsService } from './MarketsService.js';
import { UsersService } from './UsersService.js';
import { AnalyticsService } from './AnalyticsService.js';
import { publicClient } from '../lib/viem.js';
import { cacheGet, cacheSet } from '../lib/redis.js';
import { UI_POOL_DATA_PROVIDER_ABI } from '../indexer/abi.js';
import { config } from '../config/index.js';

/**
 * Concrete factory that wires all application services with their production
 * dependencies (PostgreSQL repositories, Redis cache, Viem blockchain client).
 * Implements the Abstract Factory pattern: a single creation point that
 * produces a coherent family of service objects.
 */
export class AppServiceFactory implements IServiceFactory {
    constructor(private readonly repositoryFactory: IRepositoryFactory) {}

    createHealthService(): IHealthService {
        return new HealthService();
    }

    createMarketsService(): IMarketsService {
        return new MarketsService(
            publicClient,
            { get: cacheGet, set: cacheSet },
            {
                lendingPoolAddress: config.lendingPoolAddress,
                uiDataProviderAddress: config.uiDataProviderAddress,
                uiDataProviderAbi: UI_POOL_DATA_PROVIDER_ABI,
                cacheKey: 'markets:all',
                cacheTtl: 30,
            }
        );
    }

    createUsersService(): IUsersService {
        return new UsersService(this.repositoryFactory.createUserRepository());
    }

    createAnalyticsService(): IAnalyticsService {
        return new AnalyticsService(this.repositoryFactory.createAnalyticsRepository());
    }
}
