"use client";

import React from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { GlassCard } from '@/components/atoms/GlassCard';

import { useMarkets } from '@/hooks/useMarkets';
import { useUserPositions } from '@/hooks/useUserPositions';
import { calculateHealthFactor } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

export default function PortfolioPage() {
  const { markets } = useMarkets();
  const { userPositions } = useUserPositions();
  const healthData = calculateHealthFactor(markets, userPositions);

  // Filter Positions
  const suppliedAssets = userPositions.filter(p => p.suppliedAmount > 0);
  const borrowedAssets = userPositions.filter(p => p.borrowedAmount > 0);

  // Calculate daily earnings from positions
  const netWorth = healthData.totalCollateralUSD - healthData.totalDebtUSD;
  const dailyEarnings = netWorth > 0 ? (netWorth * healthData.netAPY) / 365 : 0;

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
        <Navbar />
        
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard className="flex flex-col justify-center">
                <div className="text-gray-400 text-sm mb-1">Net Worth</div>
                <div className="text-3xl font-mono font-bold text-white">
                    {formatCurrency(healthData.totalCollateralUSD - healthData.totalDebtUSD)}
                </div>
            </GlassCard>
            <GlassCard className="flex flex-col justify-center relative overflow-hidden">
                <div className="text-gray-400 text-sm mb-1">Net APY</div>
                <div className="text-3xl font-mono font-bold text-gradient-success w-fit">
                    {formatPercentage(healthData.netAPY)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Est. Daily Earnings: <span className="text-white font-mono">{formatCurrency(dailyEarnings)}</span>
                </div>
            </GlassCard>
            <GlassCard className="flex flex-col justify-center relative overflow-hidden group">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-gray-400 text-sm mb-1">Rewards</div>
                        <div className="text-xl font-mono font-bold text-gray-500">
                            Coming Soon
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Reward program not yet active</div>
                    </div>
                </div>
                <Clock className="absolute -bottom-4 -right-4 text-gray-600/10 w-24 h-24 rotate-12 group-hover:rotate-45 transition-transform" />
            </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Supplied Assets */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-[#42e695]" size={20} />
                    Supplied Assets
                </h3>
                <GlassCard className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Asset</th>
                                <th className="p-4 text-right">Balance</th>
                                <th className="p-4 text-right">APY</th>
                                <th className="p-4 text-center">Collateral</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliedAssets.map(pos => {
                                const market = markets.find(m => m.symbol === pos.symbol);
                                if (!market) return null;
                                return (
                                    <tr key={pos.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                                {pos.symbol[0]}
                                            </div>
                                            <span className="font-bold">{pos.symbol}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono">
                                            <div>{pos.suppliedAmount}</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(pos.suppliedAmount * market.price)}</div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-[#42e695]">
                                            {formatPercentage(market.supplyAPY)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block w-2 h-2 rounded-full ${pos.isCollateral ? 'bg-[#42e695]' : 'bg-gray-600'}`} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {suppliedAssets.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No supplied assets</td></tr>
                            )}
                        </tbody>
                    </table>
                </GlassCard>
            </motion.div>

            {/* Borrowed Assets */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingDown className="text-[#FFB800]" size={20} />
                    Borrowed Assets
                </h3>
                <GlassCard className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Asset</th>
                                <th className="p-4 text-right">Debt</th>
                                <th className="p-4 text-right">APY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {borrowedAssets.map(pos => {
                                const market = markets.find(m => m.symbol === pos.symbol);
                                if (!market) return null;
                                return (
                                    <tr key={pos.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                                                {pos.symbol[0]}
                                            </div>
                                            <span className="font-bold">{pos.symbol}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono">
                                            <div>{pos.borrowedAmount}</div>
                                            <div className="text-xs text-gray-500">{formatCurrency(pos.borrowedAmount * market.price)}</div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-[#FFB800]">
                                            {formatPercentage(market.borrowAPY)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {borrowedAssets.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-500">No borrowed assets</td></tr>
                            )}
                        </tbody>
                    </table>
                </GlassCard>
            </motion.div>
        </div>
      </main>
    </>
  );
}
