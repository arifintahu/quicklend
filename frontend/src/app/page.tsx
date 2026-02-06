"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { HealthDial } from '@/components/organisms/HealthDial';
import { AssetTable } from '@/components/organisms/AssetTable';
import { ActionCard } from '@/components/organisms/ActionCard';
import { GlassCard } from '@/components/atoms/GlassCard';
import { useMarkets, MarketData } from '@/hooks/useMarkets';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useProtocolHealth } from '@/hooks/useProtocolHealth';
import { useLendingActions } from '@/hooks/useLendingActions';
import { calculateHealthFactor } from '@/lib/mock/data';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export default function Dashboard() {
    const { markets } = useMarkets();
    const { userPositions } = useUserPositions();
    const healthData = useProtocolHealth();
    const { supply, borrow } = useLendingActions();
    const [selectedAsset, setSelectedAsset] = useState<{ asset: MarketData, action: 'supply' | 'borrow' } | null>(null);

    const handleAction = (amount: number, action: 'supply' | 'borrow') => {
        if (!selectedAsset) return;

        if (action === 'supply') {
            supply(selectedAsset.asset.symbol, amount);
        } else {
            borrow(selectedAsset.asset.symbol, amount);
        }
        setSelectedAsset(null);
    };

    const calculateProjectedHF = (amount: number, action: 'supply' | 'borrow', asset: MarketData) => {
        const tempPositions = userPositions.map(p => ({ ...p }));
        const existing = tempPositions.find(p => p.assetSymbol === asset.symbol);

        if (action === 'supply') {
            if (existing) {
                existing.suppliedAmount += amount;
            } else {
                tempPositions.push({ assetSymbol: asset.symbol, suppliedAmount: amount, borrowedAmount: 0, isCollateral: true });
            }
        } else {
            if (existing) {
                existing.borrowedAmount += amount;
            } else {
                tempPositions.push({ assetSymbol: asset.symbol, suppliedAmount: 0, borrowedAmount: amount, isCollateral: false });
            }
        }

        const newData = calculateHealthFactor(markets, tempPositions);
        return newData.healthFactor;
    };

    return (
        <>
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
                <Navbar />

                <LayoutGroup>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                        {/* Hero Card - Health Factor */}
                        <GlassCard className="xl:col-span-2 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 p-8 glass-panel-strong">
                            <div className="z-10 flex-1">
                                <h2 className="text-xl font-medium text-gray-300 mb-2">Protocol Health</h2>
                                <div className="flex items-end gap-4 mb-6">
                                    <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                                        {healthData.healthFactor > 100 ? '∞' : healthData.healthFactor.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-400 mb-2">Health Factor</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Borrow Power Used</span>
                                            <span className="text-white font-mono">{formatPercentage(healthData.borrowPowerUsed)}</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${healthData.borrowPowerUsed * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="z-10 flex-shrink-0">
                                <HealthDial healthFactor={healthData.healthFactor} className="!bg-transparent !shadow-none !border-none !p-0" />
                            </div>

                            {/* Decorative background glow for Hero */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00C6FF]/10 blur-[80px] rounded-full pointer-events-none" />
                        </GlassCard>

                        {/* Quick Stats Column */}
                        <div className="space-y-6 flex flex-col">
                            <GlassCard className="flex-1 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {/* Icon placeholder */}
                                </div>
                                <div className="text-gray-400 text-sm mb-1">Net APY</div>
                                <div className="text-4xl font-mono font-bold text-gradient-success w-fit">
                                    {formatPercentage(healthData.netAPY)}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Weighted average of your positions</div>
                            </GlassCard>

                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <GlassCard className="flex flex-col justify-center">
                                    <div className="text-gray-400 text-xs mb-1">Collateral</div>
                                    <div className="text-lg font-mono font-bold text-white">
                                        {formatCurrency(healthData.totalCollateralUSD)}
                                    </div>
                                </GlassCard>
                                <GlassCard className="flex flex-col justify-center">
                                    <div className="text-gray-400 text-xs mb-1">Debt</div>
                                    <div className="text-lg font-mono font-bold text-[#FFB800]">
                                        {formatCurrency(healthData.totalDebtUSD)}
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </div>

                    {/* Markets Section */}
                    <div className="grid grid-cols-1 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="w-2 h-6 bg-gradient-to-b from-[#00C6FF] to-[#0072FF] rounded-full" />
                                    Core Assets
                                </h3>
                            </div>

                            <AssetTable
                                markets={markets}
                                userPositions={userPositions}
                                onSelectAsset={(asset) => setSelectedAsset({ asset, action: 'supply' })}
                            />
                        </motion.div>
                    </div>
                </LayoutGroup>
            </main>

            {/* Action Modal */}
            {selectedAsset && (
                <ActionCard
                    asset={selectedAsset.asset}
                    action={selectedAsset.action}
                    currentHealthFactor={healthData.healthFactor}
                    maxAmount={10000} // Mock Max
                    onClose={() => setSelectedAsset(null)}
                    onConfirm={handleAction}
                    calculateProjectedHealthFactor={(amount, action) => calculateProjectedHF(amount, action, selectedAsset.asset)}
                />
            )}
        </>
    );
}
