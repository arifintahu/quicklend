import type { IUserRepository } from './IUserRepository.js';
import type { IMarketRepository } from './IMarketRepository.js';
import type { IAnalyticsRepository } from './IAnalyticsRepository.js';
import type { IEventRepository } from './IEventRepository.js';

/**
 * Abstract Factory interface for creating data-access repository instances.
 * Implementations can target different backends (PostgreSQL, in-memory, etc.)
 * enabling easy swapping for tests or alternative storage strategies.
 */
export interface IRepositoryFactory {
    createUserRepository(): IUserRepository;
    createMarketRepository(): IMarketRepository;
    createAnalyticsRepository(): IAnalyticsRepository;
    createEventRepository(): IEventRepository;
}
