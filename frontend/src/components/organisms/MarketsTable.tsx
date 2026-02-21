import React from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { GlassCard } from '@/components/atoms/GlassCard';
import { TickerNumber } from '@/components/atoms/TickerNumber';
import { TokenIcon } from '@/components/atoms/TokenIcon';
import { Tooltip } from '@/components/atoms/Tooltip';

interface MarketsTableProps {
  markets: MarketData[];
  onSelectAsset: (asset: MarketData) => void;
}

export const MarketsTable: React.FC<MarketsTableProps> = ({ markets, onSelectAsset }) => {
  return (
    <GlassCard className="w-full overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
              <th className="p-5 font-medium">Asset</th>
              <th className="p-5 font-medium text-right">Total Supplied</th>
              <th className="p-5 font-medium text-right">
                <span className="flex items-center justify-end gap-1">
                  Supply APY
                  <Tooltip content="Annual Percentage Yield — interest earned by suppliers. Higher utilization drives higher rates." />
                </span>
              </th>
              <th className="p-5 font-medium text-right">Total Borrowed</th>
              <th className="p-5 font-medium text-right">
                <span className="flex items-center justify-end gap-1">
                  Borrow APY
                  <Tooltip content="Annual Percentage Rate — interest paid by borrowers. Automatically adjusts based on pool utilization." />
                </span>
              </th>
              <th className="p-5 font-medium text-right">
                <span className="flex items-center justify-end gap-1">
                  Utilization
                  <Tooltip content="How much of the deposited funds are currently lent out. Higher utilization means higher interest rates for both suppliers and borrowers." />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {markets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No markets found
                </td>
              </tr>
            )}
            {markets.map((market) => {
              const totalSuppliedUSD = market.totalSupplied * market.price;
              const totalBorrowedUSD = market.totalBorrowed * market.price;
              const utilization = market.totalSupplied > 0
                ? Math.min(market.totalBorrowed / market.totalSupplied, 1)
                : 0;

              return (
                <tr
                  key={market.symbol}
                  className="border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => onSelectAsset(market)}
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={market.symbol} size="md" />
                      <div>
                        <div className="font-bold text-white">{market.symbol}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="font-mono text-white">
                      <TickerNumber value={formatCurrency(totalSuppliedUSD)} />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {market.totalSupplied.toLocaleString(undefined, { maximumFractionDigits: 4 })} {market.symbol}
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="font-mono font-bold text-gradient-success w-fit ml-auto">
                      <TickerNumber value={formatPercentage(market.supplyAPY)} />
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="font-mono text-white">
                      <TickerNumber value={formatCurrency(totalBorrowedUSD)} />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {market.totalBorrowed.toLocaleString(undefined, { maximumFractionDigits: 4 })} {market.symbol}
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="font-mono font-bold text-[#FFB800] w-fit ml-auto">
                      <TickerNumber value={formatPercentage(market.borrowAPY)} />
                    </div>
                  </td>

                  <td className="p-5 text-right">
                    <div className="w-full max-w-[100px] ml-auto">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={cn(
                          "font-mono font-bold",
                          utilization > 0.8 ? "text-[#FFB800]" : "text-gray-300"
                        )}>
                          {formatPercentage(utilization)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            utilization > 0.8 ? "bg-[#FFB800]" : "bg-[#00C6FF]"
                          )}
                          style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
