"use client";

import React, { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Navbar } from '@/components/organisms/Navbar';
import { HealthDial } from '@/components/organisms/HealthDial';
import { UserSuppliesTable } from '@/components/organisms/UserSuppliesTable';
import { UserBorrowsTable } from '@/components/organisms/UserBorrowsTable';
import { ActionCard } from '@/components/organisms/ActionCard';
import { WelcomeModal } from '@/components/organisms/WelcomeModal';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { Tooltip } from '@/components/atoms/Tooltip';
import { TokenIcon } from '@/components/atoms/TokenIcon';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useMarkets } from '@/hooks/useMarkets';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useWallet } from '@/hooks/useWallet';
import { useActionModal } from '@/hooks/useActionModal';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, Shield, Activity } from 'lucide-react';

export default function Dashboard() {
    const { markets, isLoading: marketsLoading } = useMarkets();
    const { positions: userPositions, isConnected } = useUserPositions();
    const { openConnectModal } = useWallet();
    const {
        selectedAsset,
        setSelectedAsset,
        healthData,
        handleAction,
        calculateProjectedHF,
        calculateProjectedLiquidationPrice,
        getMaxAmount,
    } = useActionModal(markets, userPositions);

    const [showWelcome, setShowWelcome] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('quicklend_welcomed');
        }
        return false;
    });

    const handleCloseWelcome = () => {
        localStorage.setItem('quicklend_welcomed', '1');
        setShowWelcome(false);
    };

    const suppliedSymbols = new Set(userPositions.filter(p => p.suppliedAmount > 0).map(p => p.symbol));
    const assetsToSupply = markets.filter(m => !suppliedSymbols.has(m.symbol));

    const borrowedSymbols = new Set(userPositions.filter(p => p.borrowedAmount > 0).map(p => p.symbol));
    const assetsToBorrow = markets.filter(m => !borrowedSymbols.has(m.symbol));

    const hasSupplyPositions = userPositions.some(p => p.suppliedAmount > 0);
    const hasBorrowPositions = userPositions.some(p => p.borrowedAmount > 0);

    const bestSupplyAPY = markets.reduce((max, m) => Math.max(max, m.supplyAPY), 0);
    const bestSupplySymbol = markets.find(m => m.supplyAPY === bestSupplyAPY)?.symbol ?? '';

    return (
        <>
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto w-full">
                <Navbar />

                {/* Hero Section - Health Factor & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                    <GlassCard className="xl:col-span-2 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 p-8 glass-panel-strong">
                        <div className="z-10 flex-1">
                            <h2 className="text-xl font-medium text-gray-300 mb-2">Protocol Health</h2>
                            <div className="flex items-end gap-4 mb-6">
                                {marketsLoading ? (
                                    <Skeleton className="h-12 w-24" />
                                ) : (
                                    <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                                        {healthData.healthFactor > 100 ? '∞' : healthData.healthFactor.toFixed(2)}
                                    </span>
                                )}
                                <span className="flex items-center text-sm text-gray-400 mb-2">
                                    Health Factor
                                    <Tooltip content="Your safety score. Above 1.0 means your loan is safe. Below 1.0 and your collateral can be seized by liquidators." />
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="flex items-center text-gray-400">
                                            Borrow Power Used
                                            <Tooltip content="What percentage of your maximum borrowing capacity you are currently using. 100% means you have reached your borrowing limit." />
                                        </span>
                                        {marketsLoading ? (
                                            <Skeleton className="h-4 w-12" />
                                        ) : (
                                            <span className="text-white font-mono">{formatPercentage(healthData.borrowPowerUsed)}</span>
                                        )}
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${healthData.borrowPowerUsed * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF]"
                                        />
                                    </div>
                                    {healthData.liquidationPrice !== undefined && healthData.totalDebtUSD > 0 && (
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="flex items-center text-gray-400">
                                                Liquidation Price
                                                <Tooltip content="The collateral price at which your positions become eligible for liquidation." />
                                            </span>
                                            <span className="font-mono text-[#FF4B4B]">{formatCurrency(healthData.liquidationPrice)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="z-10 flex-shrink-0">
                            <HealthDial healthFactor={healthData.healthFactor} className="!bg-transparent !shadow-none !border-none !p-0" />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00C6FF]/10 blur-[80px] rounded-full pointer-events-none" />
                    </GlassCard>

                    <div className="space-y-6 flex flex-col">
                        <GlassCard className="flex-1 flex flex-col justify-center relative overflow-hidden group">
                            <div className="flex items-center text-gray-400 text-sm mb-1">
                                Net APY
                                <Tooltip content="Annual Percentage Yield — your net return after subtracting borrow costs from supply earnings, applied to your equity." />
                            </div>
                            {marketsLoading ? (
                                <Skeleton className="h-10 w-24 mt-1" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-gradient-success w-fit">
                                    {formatPercentage(healthData.netAPY)}
                                </div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">Weighted average of your positions</div>
                        </GlassCard>

                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <GlassCard className="flex flex-col justify-center">
                                <div className="flex items-center text-gray-400 text-xs mb-1">
                                    Collateral
                                    <Tooltip content="Total value of assets you have supplied and enabled as collateral for borrowing." />
                                </div>
                                {marketsLoading ? (
                                    <Skeleton className="h-6 w-20 mt-1" />
                                ) : (
                                    <div className="text-lg font-mono font-bold text-white">
                                        {formatCurrency(healthData.totalCollateralUSD)}
                                    </div>
                                )}
                            </GlassCard>
                            <GlassCard className="flex flex-col justify-center">
                                <div className="flex items-center text-gray-400 text-xs mb-1">
                                    Debt
                                    <Tooltip content="Total value of assets you have borrowed, which accrue interest over time." />
                                </div>
                                {marketsLoading ? (
                                    <Skeleton className="h-6 w-20 mt-1" />
                                ) : (
                                    <div className="text-lg font-mono font-bold text-[#FFB800]">
                                        {formatCurrency(healthData.totalDebtUSD)}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                </div>

                {/* Position Tables or Connect Wallet Prompt */}
                {isConnected ? (
                    <div className="space-y-8">
                        {/* Your Supplies */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {hasSupplyPositions ? (
                                <UserSuppliesTable
                                    positions={userPositions}
                                    markets={markets}
                                    onSupply={(asset) => setSelectedAsset({ asset, action: 'supply' })}
                                    onWithdraw={(asset) => setSelectedAsset({ asset, action: 'withdraw' })}
                                />
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                        <span className="w-2 h-6 bg-gradient-to-b from-[#00C6FF] to-[#0072FF] rounded-full" />
                                        Your Supplies
                                    </h3>
                                    <GlassCard className="text-center py-8">
                                        <p className="text-gray-300 font-medium mb-1">
                                            Earn up to {formatPercentage(bestSupplyAPY)} APY on {bestSupplySymbol}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Supply your first asset to start earning interest
                                        </p>
                                        {assetsToSupply[0] && (
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => setSelectedAsset({ asset: assetsToSupply[0], action: 'supply' })}
                                            >
                                                Supply {assetsToSupply[0].symbol} →
                                            </Button>
                                        )}
                                    </GlassCard>
                                </div>
                            )}
                        </motion.div>

                        {/* Your Borrows */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {hasBorrowPositions ? (
                                <UserBorrowsTable
                                    positions={userPositions}
                                    markets={markets}
                                    borrowPowerUsed={healthData.borrowPowerUsed}
                                    onBorrow={(asset) => setSelectedAsset({ asset, action: 'borrow' })}
                                    onRepay={(asset) => setSelectedAsset({ asset, action: 'repay' })}
                                />
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                        <span className="w-2 h-6 bg-gradient-to-b from-[#FFB800] to-[#FF416C] rounded-full" />
                                        Your Borrows
                                    </h3>
                                    <GlassCard className="text-center py-8">
                                        <p className="text-gray-300 font-medium mb-1">
                                            Unlock liquidity without selling your crypto
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Supply collateral first, then borrow against it at competitive rates
                                        </p>
                                    </GlassCard>
                                </div>
                            )}
                        </motion.div>

                        {/* Assets to Supply (discovery) */}
                        {assetsToSupply.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-gray-600 rounded-full" />
                                    Assets to Supply
                                </h3>
                                <GlassCard className="w-full overflow-hidden p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
                                                    <th className="p-4 font-medium">Asset</th>
                                                    <th className="p-4 font-medium text-right">
                                                        <span className="flex items-center justify-end gap-1">
                                                            Supply APY
                                                            <Tooltip content="Annual Percentage Yield — interest you earn by supplying this asset." />
                                                        </span>
                                                    </th>
                                                    <th className="p-4 font-medium text-right">Available Liquidity</th>
                                                    <th className="p-4 font-medium text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assetsToSupply.map((market) => (
                                                    <tr key={market.symbol} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <TokenIcon symbol={market.symbol} />
                                                                <span className="font-bold text-white">{market.symbol}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-mono text-gradient-success">{formatPercentage(market.supplyAPY)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-mono text-white">{formatCurrency(market.availableLiquidity * market.price)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                className="text-xs"
                                                                onClick={() => setSelectedAsset({ asset: market, action: 'supply' })}
                                                            >
                                                                Supply
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Assets to Borrow (discovery) */}
                        {assetsToBorrow.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h3 className="text-lg font-bold text-gray-300 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-gray-600 rounded-full" />
                                    Assets to Borrow
                                </h3>
                                <GlassCard className="w-full overflow-hidden p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-800 text-gray-400 text-xs font-sans uppercase tracking-wider">
                                                    <th className="p-4 font-medium">Asset</th>
                                                    <th className="p-4 font-medium text-right">
                                                        <span className="flex items-center justify-end gap-1">
                                                            Borrow APY
                                                            <Tooltip content="Annual Percentage Rate — interest you pay per year on borrowed amounts." />
                                                        </span>
                                                    </th>
                                                    <th className="p-4 font-medium text-right">Available Liquidity</th>
                                                    <th className="p-4 font-medium text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assetsToBorrow.map((market) => (
                                                    <tr key={market.symbol} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <TokenIcon symbol={market.symbol} />
                                                                <span className="font-bold text-white">{market.symbol}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-mono text-[#FFB800]">{formatPercentage(market.borrowAPY)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="font-mono text-white">{formatCurrency(market.availableLiquidity * market.price)}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="warning"
                                                                className="text-xs"
                                                                onClick={() => setSelectedAsset({ asset: market, action: 'borrow' })}
                                                            >
                                                                Borrow
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    /* Connect Wallet Prompt */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GlassCard className="text-center py-16">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Wallet size={32} className="text-[#00C6FF]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Connect your wallet to view your supply and borrow positions, track your health factor, and manage your portfolio.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={openConnectModal}
                            >
                                Connect Wallet
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 max-w-lg mx-auto text-left">
                                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <TrendingUp size={22} className="text-[#42e695]" />
                                    <span className="text-sm font-medium text-white">Supply to Earn</span>
                                    <span className="text-xs text-gray-500 text-center">Deposit assets and earn competitive APY automatically</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <Shield size={22} className="text-[#00C6FF]" />
                                    <span className="text-sm font-medium text-white">Borrow Safely</span>
                                    <span className="text-xs text-gray-500 text-center">Use your crypto as collateral for over-collateralized loans</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <Activity size={22} className="text-[#FFB800]" />
                                    <span className="text-sm font-medium text-white">Health Tracking</span>
                                    <span className="text-xs text-gray-500 text-center">Monitor your position health factor in real-time</span>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </main>

            {/* Action Modal */}
            {selectedAsset && (
                <ActionCard
                    asset={selectedAsset.asset}
                    action={selectedAsset.action}
                    currentHealthFactor={healthData.healthFactor}
                    maxAmount={getMaxAmount()}
                    onClose={() => setSelectedAsset(null)}
                    onConfirm={handleAction}
                    calculateProjectedHealthFactor={(amount, action) => calculateProjectedHF(amount, action, selectedAsset.asset)}
                    currentLiquidationPrice={healthData.liquidationPrice}
                    calculateProjectedLiquidationPrice={(amount, action) => calculateProjectedLiquidationPrice(amount, action, selectedAsset.asset)}
                />
            )}

            {/* First-visit Welcome Modal */}
            <AnimatePresence>
                {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
            </AnimatePresence>
        </>
    );
}
