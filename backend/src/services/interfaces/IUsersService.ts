export interface UserPositionDTO {
    asset: string;
    symbol: string;
    suppliedBalance: string;
    borrowedBalance: string;
    isCollateral: boolean;
}

export interface HealthFactorDTO {
    healthFactor: number;
    status: 'safe' | 'warning' | 'danger' | 'unknown';
}

export interface TransactionDTO {
    txHash: string | null;
    blockNumber: string | undefined;
    eventName: string;
    asset: string | null;
    amount: string | null;
    timestamp: Date;
}

export interface PaginationMeta {
    page: number;
    limit: number;
}

export interface UserHistoryDTO {
    data: TransactionDTO[];
    pagination: PaginationMeta;
}

export interface IUsersService {
    getPositions(address: string): Promise<UserPositionDTO[]>;
    getHealthFactor(address: string): Promise<HealthFactorDTO>;
    getHistory(address: string, page: number, limit: number): Promise<UserHistoryDTO>;
}
