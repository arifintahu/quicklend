import React from 'react';
import { MarketData, UserPosition } from '@/lib/mock/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';

interface AssetTableProps {
  markets: MarketData[];
  userPositions: UserPosition[];
  onSelectAsset: (asset: MarketData) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ markets, userPositions, onSelectAsset }) => {
  return (
    <GlassCard className="w-full overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
              <th className="p-6 font-medium">Asset</th>
              <th className="p-6 font-medium text-right">Total Supplied</th>
              <th className="p-6 font-medium text-right">Supply APY</th>
              <th className="p-6 font-medium text-right">Total Borrowed</th>
              <th className="p-6 font-medium text-right">Borrow APY</th>
              <th className="p-6 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => {
              // const position = userPositions.find((p) => p.assetSymbol === market.asset.symbol);
              
              const totalSuppliedUSD = market.totalSupplied * market.price;
              const totalBorrowedUSD = market.totalBorrowed * market.price;

              return (
                <tr 
                    key={market.asset.symbol} 
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => onSelectAsset(market)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
                        {market.asset.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{market.asset.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{market.asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-6 text-right">
                    <div className="font-mono text-white">{formatCurrency(market.totalSupplied)}</div>
                    <div className="text-xs text-gray-500 font-mono">{formatCurrency(totalSuppliedUSD)}</div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="font-mono font-bold text-gradient-success w-fit ml-auto">
                        {formatPercentage(market.supplyAPY)}
                    </div>
                  </td>

                  <td className="p-6 text-right">
                     <div className="font-mono text-white">{formatCurrency(market.totalBorrowed)}</div>
                     <div className="text-xs text-gray-500 font-mono">{formatCurrency(totalBorrowedUSD)}</div>
                  </td>

                  <td className="p-6 text-right">
                     <div className="font-mono font-bold text-[#FFB800]">
                        {formatPercentage(market.borrowAPY)}
                    </div>
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
