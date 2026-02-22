import type { IServiceFactory } from '../../services/interfaces/IServiceFactory.js';
import { UsersRouteFactory } from '../factories/UsersRouteFactory.js';

export function buildUsersRoutes(serviceFactory: IServiceFactory) {
    return new UsersRouteFactory(serviceFactory).createPlugin();
}

export { buildUsersRoutes as usersRoutes };
