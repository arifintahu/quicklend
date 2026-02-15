import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 2000),
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });

        redis.on('connect', () => {
            console.log('[Redis] Connected');
        });
    }
    return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const data = await getRedis().get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
        await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Cache write failure is non-fatal
    }
}

export async function cacheDel(key: string): Promise<void> {
    try {
        await getRedis().del(key);
    } catch {
        // Cache delete failure is non-fatal
    }
}
