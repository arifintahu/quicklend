import type { IUsersService, UserPositionDTO, HealthFactorDTO, UserHistoryDTO } from './interfaces/IUsersService.js';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js';

export class UsersService implements IUsersService {
    constructor(private readonly userRepository: IUserRepository) {}

    async getPositions(address: string): Promise<UserPositionDTO[]> {
        const positions = await this.userRepository.findPositionsByAddress(address);
        return positions.map((p) => ({
            asset: p.asset,
            symbol: p.symbol ?? '',
            suppliedBalance: p.suppliedBalance ?? '0',
            borrowedBalance: p.borrowedBalance ?? '0',
            isCollateral: p.isCollateral ?? true,
        }));
    }

    async getHealthFactor(address: string): Promise<HealthFactorDTO> {
        const position = await this.userRepository.findFirstPositionByAddress(address);
        const healthFactor = position?.healthFactor ? parseFloat(position.healthFactor) : 0;

        let status: HealthFactorDTO['status'];
        if (healthFactor >= 1.5) {
            status = 'safe';
        } else if (healthFactor >= 1.2) {
            status = 'warning';
        } else if (healthFactor > 0) {
            status = 'danger';
        } else {
            status = 'unknown';
        }

        return { healthFactor, status };
    }

    async getHistory(address: string, page: number, limit: number): Promise<UserHistoryDTO> {
        const offset = (page - 1) * limit;
        const events = await this.userRepository.findEventsByAddress(address, limit, offset);

        return {
            data: events.map((e) => ({
                txHash: e.txHash,
                blockNumber: e.blockNumber?.toString(),
                eventName: e.eventName,
                asset: e.asset,
                amount: e.amount,
                timestamp: e.createdAt,
            })),
            pagination: { page, limit },
        };
    }
}
