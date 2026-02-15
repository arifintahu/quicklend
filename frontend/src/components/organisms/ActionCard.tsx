import React, { useState, useEffect } from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionCardProps {
    asset: MarketData;
    action: 'supply' | 'borrow';
    currentHealthFactor: number;
    maxAmount: number;
    onClose: () => void;
    onConfirm: (amount: number, action: 'supply' | 'borrow') => void;
    calculateProjectedHealthFactor: (amount: number, action: 'supply' | 'borrow', asset: MarketData) => number;
}

export const ActionCard: React.FC<ActionCardProps> = ({
    asset,
    action: initialAction,
    currentHealthFactor,
    maxAmount,
    onClose,
    onConfirm,
    calculateProjectedHealthFactor
}) => {
    const [action, setAction] = useState<'supply' | 'borrow'>(initialAction);
    const [amount, setAmount] = useState<string>('');
    const [projectedHF, setProjectedHF] = useState<number>(currentHealthFactor);

    useEffect(() => {
        const numAmount = parseFloat(amount) || 0;
        if (numAmount > 0) {
            setProjectedHF(calculateProjectedHealthFactor(numAmount, action, asset));
        } else {
            setProjectedHF(currentHealthFactor);
        }
    }, [amount, action, asset, currentHealthFactor, calculateProjectedHealthFactor]);

    const handleMax = () => {
        setAmount(maxAmount.toString());
    };

    const getHealthColor = (hf: number) => {
        if (hf < 1.1) return 'text-[#FF4B4B]';
        if (hf < 1.5) return 'text-[#FFB800]';
        return 'text-[#00FF41]';
    };

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

                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                            {asset.symbol[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{asset.symbol}</h2>
                            <span className="text-sm font-normal text-gray-500">{asset.symbol}</span>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setAction('supply')}
                            className={cn(
                                "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                action === 'supply' ? "bg-[#00C6FF] text-white shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            Supply
                        </button>
                        <button
                            onClick={() => setAction('borrow')}
                            className={cn(
                                "py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                action === 'borrow' ? "bg-[#FF4B4B] text-white shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            Borrow
                        </button>
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
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Health Factor</span>
                            <div className="flex items-center gap-2 font-mono font-bold">
                                <span className={getHealthColor(currentHealthFactor)}>
                                    {currentHealthFactor.toFixed(2)}
                                </span>
                                {parseFloat(amount) > 0 && (
                                    <>
                                        <ArrowRight size={16} className="text-gray-500" />
                                        <span className={getHealthColor(projectedHF)}>
                                            {projectedHF.toFixed(2)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Liquidation Price Preview */}
                        {action === 'borrow' && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Liq. Price (Est.)</span>
                                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                                    <span className="text-gray-300">$1,850.00</span>
                                    <ArrowRight size={14} className="text-gray-500" />
                                    <span className="text-[#FF4B4B]">$2,100.00</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Projected APY</span>
                            <span className={action === 'supply' ? "text-[#42e695]" : "text-[#FFB800]"}>
                                {formatPercentage(action === 'supply' ? asset.supplyAPY : -asset.borrowAPY)}
                            </span>
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        variant={action === 'supply' ? 'primary' : 'danger'}
                        onClick={() => onConfirm(parseFloat(amount), action)}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        {action === 'supply' ? 'Supply' : 'Borrow'} {asset.symbol}
                    </Button>

                </GlassCard>
            </motion.div>
        </AnimatePresence>
    );
};
