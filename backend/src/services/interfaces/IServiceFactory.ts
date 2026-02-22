import type { IHealthService } from './IHealthService.js';
import type { IMarketsService } from './IMarketsService.js';
import type { IUsersService } from './IUsersService.js';
import type { IAnalyticsService } from './IAnalyticsService.js';

/**
 * Abstract Factory interface for creating business-logic service instances.
 * Each concrete factory provides a coherent family of services wired to a
 * specific set of dependencies (real DB, in-memory, etc.).
 */
export interface IServiceFactory {
    createHealthService(): IHealthService;
    createMarketsService(): IMarketsService;
    createUsersService(): IUsersService;
    createAnalyticsService(): IAnalyticsService;
}
