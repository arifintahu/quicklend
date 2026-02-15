import React from 'react';
import { UserPosition } from '@/hooks/useUserPositions';
import { MarketData } from '@/hooks/useMarkets';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { TickerNumber } from '@/components/atoms/TickerNumber';
import { ToggleLeft } from 'lucide-react'; // Placeholder for visual toggle, implement actual functional switch if needed
import { motion } from 'framer-motion';

interface AssetTableProps {
  markets: MarketData[];
  userPositions: UserPosition[];
  onSelectAsset: (asset: MarketData) => void;
  onToggleCollateral?: (asset: MarketData) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ markets, userPositions, onSelectAsset, onToggleCollateral }) => {
  return (
    <GlassCard className="w-full overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
              <th className="p-6 font-medium">Asset</th>
              <th className="p-6 font-medium text-right">Available Liquidity</th>
              <th className="p-6 font-medium text-right">Total Supplied</th>
              <th className="p-6 font-medium text-right">Supply APY</th>
              <th className="p-6 font-medium text-right">Total Borrowed</th>
              <th className="p-6 font-medium text-right">Borrow APY</th>
              <th className="p-6 font-medium text-center">Collateral</th>
              <th className="p-6 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => {
              // Support flat structure from useMarkets hook
              const symbol = market.symbol || '';
              const name = market.symbol || '';
              const position = userPositions?.find((p) => p.symbol === symbol);

              const totalSuppliedUSD = market.totalSupplied * market.price;
              const totalBorrowedUSD = market.totalBorrowed * market.price;
              const utilization = market.totalSupplied > 0 ? (market.totalBorrowed / market.totalSupplied) : 0;
              const availableLiquidityUSD = (market.availableLiquidity || 0) * market.price;

              return (
                <tr
                  key={symbol}
                  className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => onSelectAsset(market)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
                        {symbol[0] || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{name}</div>
                        <div className="text-xs text-gray-500 font-mono">{symbol}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="font-mono text-white">
                      <TickerNumber value={formatCurrency(availableLiquidityUSD)} />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{formatCurrency(market.availableLiquidity || 0)} {symbol}</div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="font-mono text-white">{formatCurrency(market.totalSupplied)}</div>
                    <div className="text-xs text-gray-500 font-mono">{formatCurrency(totalSuppliedUSD)}</div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="font-mono font-bold text-gradient-success w-fit ml-auto">
                      <TickerNumber value={formatPercentage(market.supplyAPY)} />
                    </div>
                  </td>

                  <td className="p-6 text-right min-w-[150px]">
                    <div className="font-mono text-white">{formatCurrency(market.totalBorrowed)}</div>
                    <div className="text-xs text-gray-500 font-mono mb-2">{formatCurrency(totalBorrowedUSD)}</div>

                    {/* Utilization Bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          utilization > 0.8 ? "bg-[#FFB800]" : "bg-[#00C6FF]"
                        )}
                        style={{ width: `${Math.min(utilization * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 text-right">{formatPercentage(utilization)} Util.</div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="font-mono font-bold text-[#FFB800]">
                      <TickerNumber value={formatPercentage(market.borrowAPY)} />
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    {position && position.suppliedAmount > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCollateral?.(market);
                        }}
                        className={cn(
                          "w-10 h-6 rounded-full p-1 transition-colors duration-200 relative",
                          position.isCollateral ? "bg-[#42e695]" : "bg-gray-700"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                          position.isCollateral ? "translate-x-4" : "translate-x-0"
                        )} />
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs">-</span>
                    )}
                  </td>

                  <td className="p-6 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs border-white/20 hover:bg-white/10 text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(market);
                      }}
                    >
                      Details
                    </Button>
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
