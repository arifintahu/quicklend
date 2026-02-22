import type { IHealthService, HealthStatus } from './interfaces/IHealthService.js';

export class HealthService implements IHealthService {
    private readonly version: string;

    constructor(version = '1.0.0') {
        this.version = version;
    }

    getStatus(): HealthStatus {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: this.version,
        };
    }
}
