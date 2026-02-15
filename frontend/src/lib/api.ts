const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface TransactionEvent {
    txHash: string;
    blockNumber: string;
    eventName: string;
    asset: string;
    amount: string | null;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
    };
}

export interface AnalyticsTVL {
    total: number;
    byAsset: Record<string, number>;
}

export async function fetchHistory(
    address: string,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<TransactionEvent>> {
    const url = `${API_BASE}/api/v1/users/${address}/history?page=${page}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.statusText}`);
    }
    return res.json();
}

export async function fetchAnalytics(): Promise<{ success: boolean; data: AnalyticsTVL }> {
    const res = await fetch(`${API_BASE}/api/v1/analytics/tvl`);
    if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    }
    return res.json();
}
