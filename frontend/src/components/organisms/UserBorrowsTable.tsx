import React from 'react';
import { UserPosition } from '@/hooks/useUserPositions';
import { MarketData } from '@/hooks/useMarkets';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { TickerNumber } from '@/components/atoms/TickerNumber';

interface UserBorrowsTableProps {
  positions: UserPosition[];
  markets: MarketData[];
  borrowPowerUsed: number;
  onBorrow: (asset: MarketData) => void;
  onRepay: (asset: MarketData) => void;
}

export const UserBorrowsTable: React.FC<UserBorrowsTableProps> = ({
  positions,
  markets,
  borrowPowerUsed,
  onBorrow,
  onRepay,
}) => {
  const borrowPositions = positions.filter((p) => p.borrowedAmount > 0);

  const totalBorrowedUSD = borrowPositions.reduce((acc, pos) => {
    const market = markets.find((m) => m.symbol === pos.symbol);
    return acc + (market ? pos.borrowedAmount * market.price : 0);
  }, 0);

  if (borrowPositions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-gradient-to-b from-[#FFB800] to-[#FF416C] rounded-full" />
          Your Borrows
        </h3>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <span>
            Total debt: <span className="text-[#FFB800] font-mono font-bold">{formatCurrency(totalBorrowedUSD)}</span>
          </span>
          <span>
            Borrow power used: <span className="text-white font-mono font-bold">{formatPercentage(borrowPowerUsed)}</span>
          </span>
        </div>
      </div>

      <GlassCard className="w-full overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
                <th className="p-5 font-medium">Asset</th>
                <th className="p-5 font-medium text-right">Debt</th>
                <th className="p-5 font-medium text-right">Borrow APY</th>
                <th className="p-5 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {borrowPositions.map((pos) => {
                const market = markets.find((m) => m.symbol === pos.symbol);
                if (!market) return null;

                const debtUSD = pos.borrowedAmount * market.price;

                return (
                  <tr
                    key={pos.symbol}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
                          {pos.symbol[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white">{pos.symbol}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="font-mono text-white">
                        {pos.borrowedAmount.toFixed(4)} {pos.symbol}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {formatCurrency(debtUSD)}
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="font-mono font-bold text-[#FFB800] w-fit ml-auto">
                        <TickerNumber value={formatPercentage(market.borrowAPY)} />
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => onRepay(market)}
                        >
                          Repay
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="text-xs"
                          onClick={() => onBorrow(market)}
                        >
                          Borrow
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
