import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHistory, fetchAnalytics } from '../api';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('API Client', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    describe('fetchHistory', () => {
        it('calls the correct URL with default pagination', async () => {
            const mockResponse = {
                success: true,
                data: [
                    {
                        txHash: '0xabc123',
                        blockNumber: '100',
                        eventName: 'Supply',
                        asset: '0x1111',
                        amount: '1000000',
                        timestamp: '2026-01-01T00:00:00Z',
                    },
                ],
                pagination: { page: 1, limit: 20 },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await fetchHistory('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/v1/users/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/history?page=1&limit=20'
            );
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].eventName).toBe('Supply');
        });

        it('supports custom pagination parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: [], pagination: { page: 3, limit: 50 } }),
            });

            await fetchHistory('0xabc', 3, 50);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/v1/users/0xabc/history?page=3&limit=50'
            );
        });

        it('throws on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchHistory('0xabc')).rejects.toThrow('Failed to fetch history: Internal Server Error');
        });

        it('handles empty data response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: [], pagination: { page: 1, limit: 20 } }),
            });

            const result = await fetchHistory('0xabc');

            expect(result.data).toEqual([]);
        });

        it('returns multiple events sorted', async () => {
            const events = [
                { txHash: '0x1', blockNumber: '200', eventName: 'Borrow', asset: '0xa', amount: '500', timestamp: '2026-01-02T00:00:00Z' },
                { txHash: '0x2', blockNumber: '100', eventName: 'Supply', asset: '0xb', amount: '1000', timestamp: '2026-01-01T00:00:00Z' },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: events, pagination: { page: 1, limit: 20 } }),
            });

            const result = await fetchHistory('0xabc');
            expect(result.data).toHaveLength(2);
        });
    });

    describe('fetchAnalytics', () => {
        it('fetches TVL data', async () => {
            const mockResponse = {
                success: true,
                data: {
                    total: 50_000_000,
                    byAsset: {
                        USDC: 20_000_000,
                        WETH: 25_000_000,
                        WBTC: 5_000_000,
                    },
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await fetchAnalytics();

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/v1/analytics/tvl');
            expect(result.data.total).toBe(50_000_000);
            expect(Object.keys(result.data.byAsset)).toHaveLength(3);
        });

        it('throws on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Service Unavailable',
            });

            await expect(fetchAnalytics()).rejects.toThrow('Failed to fetch analytics: Service Unavailable');
        });
    });
});
