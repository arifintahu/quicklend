import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketData } from '@/hooks/useMarkets';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { Tooltip } from '@/components/atoms/Tooltip';
import { TokenIcon } from '@/components/atoms/TokenIcon';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { ArrowRight, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ActionType = 'supply' | 'borrow' | 'withdraw' | 'repay';

type Step = 'input' | 'approve' | 'confirm';

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
    const [step, setStep] = useState<Step>('input');

    const {
        needsApproval,
        approveMax,
        isApproving,
        isConfirmingApproval,
        isApproved,
        refetchAllowance,
        resetApprove,
    } = useTokenApproval(asset.asset as `0x${string}`);

    const numAmount = parseFloat(amount) || 0;

    const projectedHF = useMemo(() => {
        if (numAmount > 0) return calculateProjectedHealthFactor(numAmount, action, asset);
        return currentHealthFactor;
    }, [numAmount, action, asset, currentHealthFactor, calculateProjectedHealthFactor]);

    const projectedLiqPrice = useMemo(() => {
        if (numAmount > 0 && calculateProjectedLiquidationPrice) {
            return calculateProjectedLiquidationPrice(numAmount, action, asset);
        }
        return currentLiquidationPrice;
    }, [numAmount, action, asset, currentLiquidationPrice, calculateProjectedLiquidationPrice]);

    // When approval confirmed, move to confirm step
    useEffect(() => {
        if (isApproved && step === 'approve') {
            refetchAllowance();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStep('confirm');
        }
    }, [isApproved, step, refetchAllowance]);

    // Reset approval state when action type changes (prevents stale isApproved latch)
    useEffect(() => {
        resetApprove();
    }, [action, resetApprove]);

    // Escape key closes modal
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleMax = () => {
        setAmount(maxAmount.toString());
    };

    const handleBackToInput = () => {
        resetApprove();
        setStep('input');
    };

    const safeNeedsApproval = (amt: string): boolean => {
        if (!amt || parseFloat(amt) <= 0) return false;
        try {
            return needsApproval(amt);
        } catch {
            return true;
        }
    };

    const handleActionButtonClick = () => {
        const needsApprovalForAction = (action === 'supply' || action === 'repay') && safeNeedsApproval(amount);
        if (needsApprovalForAction) {
            setStep('approve');
        } else {
            setStep('confirm');
        }
    };

    const getHealthColor = (hf: number) => {
        if (hf < 1.1) return 'text-[#FF4B4B]';
        if (hf < 1.5) return 'text-[#FFB800]';
        return 'text-[#00FF41]';
    };

    const formatHF = (hf: number) => (hf > 100 ? '∞' : hf.toFixed(2));

    const buttonVariant = (): 'primary' | 'secondary' | 'warning' => {
        if (action === 'supply') return 'primary';
        if (action === 'withdraw') return 'secondary';
        if (action === 'repay') return 'secondary';
        return 'warning';
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

    const usdValue = numAmount * asset.price;
    // Block confirmation when projected HF < 1.0 for actions that reduce health factor
    const isConfirmBlocked = projectedHF < 1.0 && (action === 'borrow' || action === 'withdraw');

    const totalSteps = (action === 'supply' || action === 'repay') ? 2 : 1;
    const currentStep = step === 'approve' ? 1 : step === 'confirm' ? totalSteps : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="action-card-title"
            >
                <GlassCard className="w-full max-w-md relative border border-[#00F0FF]/20 glass-panel-strong">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <TokenIcon symbol={asset.symbol} size="lg" />
                        <div>
                            <h2 id="action-card-title" className="text-xl font-bold">{asset.symbol}</h2>
                            <span className="text-sm font-normal text-gray-500">
                                {formatCurrency(asset.price)} per token
                            </span>
                        </div>
                    </div>

                    {/* Step indicator (approve/confirm steps) */}
                    {step !== 'input' && (
                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                            <span className={cn(
                                'px-2 py-0.5 rounded-full font-medium',
                                step === 'approve' ? 'bg-[#FFB800]/20 text-[#FFB800]' : 'bg-white/10 text-gray-400'
                            )}>
                                Step {currentStep} of {totalSteps}
                            </span>
                            <span>
                                {step === 'approve' ? 'Approve Token' : 'Confirm Transaction'}
                            </span>
                        </div>
                    )}

                    {/* INPUT STEP */}
                    {step === 'input' && (
                        <>
                            {/* Toggle Switch */}
                            <div className="grid grid-cols-2 bg-black/20 p-1 rounded-xl mb-6">
                                {isSupplyMode ? (
                                    <>
                                        <button
                                            onClick={() => setAction('supply')}
                                            className={cn(
                                                "py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
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
                                                "py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
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
                                                "py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                                                action === 'borrow'
                                                    ? "bg-[#FFB800] text-black shadow-lg"
                                                    : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Borrow
                                        </button>
                                        <button
                                            onClick={() => setAction('repay')}
                                            className={cn(
                                                "py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
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
                                        autoFocus
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full glass-input rounded-xl p-4 text-3xl font-mono focus:border-[#00F0FF] focus:outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleMax}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00F0FF] font-bold hover:text-[#00F0FF]/80 cursor-pointer"
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
                                        {numAmount > 0 && (
                                            <>
                                                <ArrowRight size={16} className="text-gray-500" />
                                                <span className={getHealthColor(projectedHF)}>
                                                    {formatHF(projectedHF)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Liquidation Price */}
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
                                                    {numAmount > 0 && projectedLiqPrice !== undefined && (
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
                                onClick={handleActionButtonClick}
                                disabled={!amount || numAmount <= 0 || numAmount > maxAmount}
                            >
                                {numAmount > maxAmount ? 'Exceeds maximum' : buttonLabel()}
                            </Button>
                        </>
                    )}

                    {/* APPROVE STEP */}
                    {step === 'approve' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    This gives QuickLend permission to use your{' '}
                                    <span className="font-bold text-white">{asset.symbol}</span>.{' '}
                                    One-time step per token.
                                </p>
                            </div>

                            {isApproved ? (
                                <div className="flex items-center gap-3 text-[#42e695] font-medium">
                                    <CheckCircle size={20} />
                                    <span>Approved! Moving to confirmation...</span>
                                </div>
                            ) : (
                                <Button
                                    fullWidth
                                    size="lg"
                                    variant="primary"
                                    onClick={approveMax}
                                    disabled={isApproving || isConfirmingApproval}
                                >
                                    {(isApproving || isConfirmingApproval) ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={18} className="animate-spin" />
                                            {isApproving ? 'Approving...' : 'Confirming...'}
                                        </span>
                                    ) : (
                                        `Approve ${asset.symbol}`
                                    )}
                                </Button>
                            )}

                            <Button
                                fullWidth
                                size="md"
                                variant="ghost"
                                onClick={handleBackToInput}
                                disabled={isApproving || isConfirmingApproval}
                            >
                                Back
                            </Button>
                        </div>
                    )}

                    {/* CONFIRM STEP */}
                    {step === 'confirm' && (
                        <div className="space-y-6">
                            {/* Transaction Summary */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Action</span>
                                    <span className="font-bold capitalize text-white">{action}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Amount</span>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-white">{numAmount} {asset.symbol}</div>
                                        <div className="text-xs text-gray-500">{formatCurrency(usdValue)}</div>
                                    </div>
                                </div>

                                {/* Health Factor */}
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center text-gray-400 text-sm">
                                        Health Factor
                                        <Tooltip content="Your safety score after this transaction." />
                                    </span>
                                    <div className="flex items-center gap-2 font-mono font-bold text-sm">
                                        <span className={getHealthColor(currentHealthFactor)}>
                                            {formatHF(currentHealthFactor)}
                                        </span>
                                        <ArrowRight size={14} className="text-gray-500" />
                                        <span className={getHealthColor(projectedHF)}>
                                            {formatHF(projectedHF)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning banners */}
                            {projectedHF < 1.5 && projectedHF >= 1.0 && (
                                <div className="flex items-start gap-3 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl p-3 text-sm text-[#FFB800]">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>Health Factor below 1.5. Consider reducing the amount to maintain a safer position.</span>
                                </div>
                            )}
                            {projectedHF < 1.0 && (
                                <div className="flex items-start gap-3 bg-[#FF4B4B]/10 border border-[#FF4B4B]/20 rounded-xl p-3 text-sm text-[#FF4B4B]">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span>This transaction would bring your Health Factor below 1.0, making you eligible for liquidation. Transaction blocked.</span>
                                </div>
                            )}

                            <Button
                                fullWidth
                                size="lg"
                                variant={buttonVariant()}
                                onClick={() => onConfirm(numAmount, action)}
                                disabled={isConfirmBlocked}
                            >
                                Confirm in Wallet
                            </Button>

                            <Button
                                fullWidth
                                size="md"
                                variant="ghost"
                                onClick={handleBackToInput}
                            >
                                Back
                            </Button>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </AnimatePresence>
    );
};
