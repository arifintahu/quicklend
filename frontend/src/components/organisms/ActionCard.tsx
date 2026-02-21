import React, { useState, useEffect } from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { Tooltip } from '@/components/atoms/Tooltip';
import { TokenIcon } from '@/components/atoms/TokenIcon';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActionType = 'supply' | 'borrow' | 'withdraw' | 'repay';

interface ActionCardProps {
    asset: MarketData;
    action: ActionType;
    currentHealthFactor: number;
    maxAmount: number;
    onClose: () => void;
    onConfirm: (amount: number, action: ActionType) => void;
    calculateProjectedHealthFactor: (amount: number, action: ActionType, asset: MarketData) => number;
    currentLiquidationPrice?: number;
    calculateProjectedLiquidationPrice?: (amount: number, action: ActionType, asset: MarketData) => number | undefined;
}

export const ActionCard: React.FC<ActionCardProps> = ({
    asset,
    action: initialAction,
    currentHealthFactor,
    maxAmount,
    onClose,
    onConfirm,
    calculateProjectedHealthFactor,
    currentLiquidationPrice,
    calculateProjectedLiquidationPrice,
}) => {
    const isSupplyMode = initialAction === 'supply' || initialAction === 'withdraw';
    const [action, setAction] = useState<ActionType>(initialAction);
    const [amount, setAmount] = useState<string>('');
    const [projectedHF, setProjectedHF] = useState<number>(currentHealthFactor);
    const [projectedLiqPrice, setProjectedLiqPrice] = useState<number | undefined>(currentLiquidationPrice);

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            setProjectedHF(calculateProjectedHealthFactor(numAmount, action, asset));
            if (calculateProjectedLiquidationPrice) {
                setProjectedLiqPrice(calculateProjectedLiquidationPrice(numAmount, action, asset));
            }
        } else {
            setProjectedHF(currentHealthFactor);
            setProjectedLiqPrice(currentLiquidationPrice);
        }
    }, [amount, action, asset, currentHealthFactor, currentLiquidationPrice, calculateProjectedHealthFactor, calculateProjectedLiquidationPrice]);

    const handleMax = () => {
        setAmount(maxAmount.toString());
    };

    const getHealthColor = (hf: number) => {
        if (hf < 1.1) return 'text-[#FF4B4B]';
        if (hf < 1.5) return 'text-[#FFB800]';
        return 'text-[#00FF41]';
    };

    const formatHF = (hf: number) => (hf > 100 ? '∞' : hf.toFixed(2));

    const buttonVariant = (): 'primary' | 'secondary' | 'danger' => {
        if (action === 'supply') return 'primary';
        if (action === 'withdraw') return 'secondary';
        if (action === 'repay') return 'secondary';
        return 'danger';
    };

    const buttonLabel = () => {
        switch (action) {
            case 'supply': return `Supply ${asset.symbol}`;
            case 'borrow': return `Borrow ${asset.symbol}`;
            case 'withdraw': return `Withdraw ${asset.symbol}`;
            case 'repay': return `Repay ${asset.symbol}`;
        }
    };

    const apyLabel = isSupplyMode ? 'Supply APY' : 'Borrow APY';
    const apyValue = isSupplyMode ? asset.supplyAPY : asset.borrowAPY;
    const apyColor = isSupplyMode ? 'text-[#42e695]' : 'text-[#FFB800]';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <GlassCard className="w-full max-w-md relative border border-[#00F0FF]/20 glass-panel-strong">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <TokenIcon symbol={asset.symbol} size="lg" />
                        <div>
                            <h2 className="text-xl font-bold">{asset.symbol}</h2>
                            <span className="text-sm font-normal text-gray-500">
                                {formatCurrency(asset.price)} per token
                            </span>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl mb-6">
                        {isSupplyMode ? (
                            <>
                                <button
                                    onClick={() => setAction('supply')}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        action === 'supply'
                                            ? "bg-[#00C6FF] text-white shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Supply
                                </button>
                                <button
                                    onClick={() => setAction('withdraw')}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        action === 'withdraw'
                                            ? "bg-[#42e695] text-black shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Withdraw
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setAction('borrow')}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        action === 'borrow'
                                            ? "bg-[#FF4B4B] text-white shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Borrow
                                </button>
                                <button
                                    onClick={() => setAction('repay')}
                                    className={cn(
                                        "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        action === 'repay'
                                            ? "bg-[#42e695] text-black shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Repay
                                </button>
                            </>
                        )}
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Amount</span>
                            <span>Max: {formatCurrency(maxAmount * asset.price)}</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full glass-input rounded-xl p-4 text-3xl font-mono focus:border-[#00F0FF] focus:outline-none transition-colors"
                            />
                            <button
                                onClick={handleMax}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00F0FF] font-bold hover:text-[#00F0FF]/80"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 mb-8 space-y-3 border border-white/5">
                        {/* Health Factor */}
                        <div className="flex justify-between items-center">
                            <span className="flex items-center text-gray-400">
                                Health Factor
                                <Tooltip content="Your safety score. Above 1.0 means your loan is safe. Below 1.0 and your collateral can be seized by liquidators." />
                            </span>
                            <div className="flex items-center gap-2 font-mono font-bold">
                                <span className={getHealthColor(currentHealthFactor)}>
                                    {formatHF(currentHealthFactor)}
                                </span>
                                {parseFloat(amount) > 0 && (
                                    <>
                                        <ArrowRight size={16} className="text-gray-500" />
                                        <span className={getHealthColor(projectedHF)}>
                                            {formatHF(projectedHF)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Liquidation Price — calculated dynamically */}
                        {(action === 'borrow' || action === 'repay') && (
                            <div className="flex justify-between items-center">
                                <span className="flex items-center text-gray-400 text-sm">
                                    Liq. Price (Est.)
                                    <Tooltip content="The collateral price at which your loan becomes eligible for liquidation. Repaying debt raises this threshold." />
                                </span>
                                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                                    {currentLiquidationPrice !== undefined ? (
                                        <>
                                            <span className="text-gray-300">
                                                {formatCurrency(currentLiquidationPrice)}
                                            </span>
                                            {parseFloat(amount) > 0 && projectedLiqPrice !== undefined && (
                                                <>
                                                    <ArrowRight size={14} className="text-gray-500" />
                                                    <span className={
                                                        action === 'borrow'
                                                            ? 'text-[#FF4B4B]'
                                                            : 'text-[#42e695]'
                                                    }>
                                                        {formatCurrency(projectedLiqPrice)}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* APY */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center text-gray-400">
                                {apyLabel}
                                <Tooltip content="Annual Percentage Yield — how much interest you earn (or pay) per year, automatically compounded." />
                            </span>
                            <span className={apyColor}>
                                {formatPercentage(apyValue)}
                            </span>
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        variant={buttonVariant()}
                        onClick={() => onConfirm(parseFloat(amount), action)}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        {buttonLabel()}
                    </Button>
                </GlassCard>
            </motion.div>
        </AnimatePresence>
    );
};
