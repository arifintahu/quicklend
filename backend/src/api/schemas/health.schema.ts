import { Type } from '@sinclair/typebox';

export const HealthResponseSchema = Type.Object({
    status: Type.String({ description: 'Service health status' }),
    timestamp: Type.String({ description: 'ISO 8601 timestamp' }),
    uptime: Type.Number({ description: 'Process uptime in seconds' }),
    version: Type.String({ description: 'API version' }),
});
