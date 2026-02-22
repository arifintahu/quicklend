import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthService } from '../../services/HealthService.js';

describe('HealthService', () => {
    let service: HealthService;

    beforeEach(() => {
        service = new HealthService('2.0.0');
    });

    it('returns healthy status', () => {
        const result = service.getStatus();
        expect(result.status).toBe('healthy');
    });

    it('returns the injected version', () => {
        const result = service.getStatus();
        expect(result.version).toBe('2.0.0');
    });

    it('returns a valid ISO 8601 timestamp', () => {
        const result = service.getStatus();
        expect(() => new Date(result.timestamp)).not.toThrow();
        expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('returns a non-negative uptime number', () => {
        const result = service.getStatus();
        expect(typeof result.uptime).toBe('number');
        expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('defaults to version 1.0.0 when none is provided', () => {
        const defaultService = new HealthService();
        expect(defaultService.getStatus().version).toBe('1.0.0');
    });
});
