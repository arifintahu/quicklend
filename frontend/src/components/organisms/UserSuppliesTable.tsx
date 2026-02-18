import React from 'react';
import { UserPosition } from '@/hooks/useUserPositions';
import { MarketData } from '@/hooks/useMarkets';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { TickerNumber } from '@/components/atoms/TickerNumber';

interface UserSuppliesTableProps {
  positions: UserPosition[];
  markets: MarketData[];
  onSupply: (asset: MarketData) => void;
  onWithdraw: (asset: MarketData) => void;
  onToggleCollateral?: (asset: MarketData) => void;
}

export const UserSuppliesTable: React.FC<UserSuppliesTableProps> = ({
  positions,
  markets,
  onSupply,
  onWithdraw,
  onToggleCollateral,
}) => {
  const supplyPositions = positions.filter((p) => p.suppliedAmount > 0);

  const totalSuppliedUSD = supplyPositions.reduce((acc, pos) => {
    const market = markets.find((m) => m.symbol === pos.symbol);
    return acc + (market ? pos.suppliedAmount * market.price : 0);
  }, 0);

  if (supplyPositions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-gradient-to-b from-[#00C6FF] to-[#0072FF] rounded-full" />
          Your Supplies
        </h3>
        <div className="text-sm text-gray-400">
          Total supplied: <span className="text-white font-mono font-bold">{formatCurrency(totalSuppliedUSD)}</span>
        </div>
      </div>

      <GlassCard className="w-full overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
                <th className="p-5 font-medium">Asset</th>
                <th className="p-5 font-medium text-right">Balance</th>
                <th className="p-5 font-medium text-right">Supply APY</th>
                <th className="p-5 font-medium text-center">Collateral</th>
                <th className="p-5 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {supplyPositions.map((pos) => {
                const market = markets.find((m) => m.symbol === pos.symbol);
                if (!market) return null;

                const balanceUSD = pos.suppliedAmount * market.price;

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
                        {pos.suppliedAmount.toFixed(4)} {pos.symbol}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {formatCurrency(balanceUSD)}
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="font-mono font-bold text-gradient-success w-fit ml-auto">
                        <TickerNumber value={formatPercentage(market.supplyAPY)} />
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <button
                        onClick={() => onToggleCollateral?.(market)}
                        className={cn(
                          "w-10 h-6 rounded-full p-1 transition-colors duration-200 relative inline-block",
                          pos.isCollateral ? "bg-[#42e695]" : "bg-gray-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                            pos.isCollateral ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => onWithdraw(market)}
                        >
                          Withdraw
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs"
                          onClick={() => onSupply(market)}
                        >
                          Supply
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
