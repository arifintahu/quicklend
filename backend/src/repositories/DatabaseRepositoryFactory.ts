import type { IRepositoryFactory } from './interfaces/IRepositoryFactory.js';
import type { IUserRepository } from './interfaces/IUserRepository.js';
import type { IMarketRepository } from './interfaces/IMarketRepository.js';
import type { IAnalyticsRepository } from './interfaces/IAnalyticsRepository.js';
import type { IEventRepository } from './interfaces/IEventRepository.js';
import { UserRepository } from './UserRepository.js';
import { MarketRepository } from './MarketRepository.js';
import { AnalyticsRepository } from './AnalyticsRepository.js';
import { EventRepository } from './EventRepository.js';

/**
 * Concrete factory that produces PostgreSQL-backed repository instances.
 * Implements the Abstract Factory pattern: a single point of creation for
 * all repository objects that share the same database backend.
 */
export class DatabaseRepositoryFactory implements IRepositoryFactory {
    private static instance: DatabaseRepositoryFactory;

    static getInstance(): DatabaseRepositoryFactory {
        if (!DatabaseRepositoryFactory.instance) {
            DatabaseRepositoryFactory.instance = new DatabaseRepositoryFactory();
        }
        return DatabaseRepositoryFactory.instance;
    }

    createUserRepository(): IUserRepository {
        return new UserRepository();
    }

    createMarketRepository(): IMarketRepository {
        return new MarketRepository();
    }

    createAnalyticsRepository(): IAnalyticsRepository {
        return new AnalyticsRepository();
    }

    createEventRepository(): IEventRepository {
        return new EventRepository();
    }
}
