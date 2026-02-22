export interface HealthStatus {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
}

export interface IHealthService {
    getStatus(): HealthStatus;
}
