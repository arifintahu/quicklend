import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { HealthRouteFactory } from '../factories/HealthRouteFactory.js';

export function buildHealthRoutes(serviceFactory: IServiceFactory) {
    return new HealthRouteFactory(serviceFactory).createPlugin();
}

// Backward-compatible named export consumed by index.ts
export { buildHealthRoutes as healthRoutes };
