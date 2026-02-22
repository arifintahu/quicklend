import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { AnalyticsRouteFactory } from '../factories/AnalyticsRouteFactory.js';

export function buildAnalyticsRoutes(serviceFactory: IServiceFactory) {
    return new AnalyticsRouteFactory(serviceFactory).createPlugin();
}

export { buildAnalyticsRoutes as analyticsRoutes };
