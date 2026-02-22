import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { MarketsRouteFactory } from '../factories/MarketsRouteFactory.js';

export function buildMarketsRoutes(serviceFactory: IServiceFactory) {
    return new MarketsRouteFactory(serviceFactory).createPlugin();
}

export { buildMarketsRoutes as marketsRoutes };
