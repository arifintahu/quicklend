'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/atoms/GlassCard';
import { Button } from '@/components/atoms/Button';
import { TrendingUp, Shield, Zap, X } from 'lucide-react';

interface WelcomeModalProps {
    onClose: () => void;
}

const STEPS = [
    {
        icon: <TrendingUp size={22} className="text-[#42e695]" />,
        title: 'Supply assets to earn interest',
        description:
            'Deposit tokens into QuickLend to start earning yield. You receive qTokens that automatically accumulate interest — withdraw any time.',
    },
    {
        icon: <Zap size={22} className="text-[#00C6FF]" />,
        title: 'Borrow against your collateral',
        description:
            'Use your supplied assets as collateral to borrow other tokens instantly. No credit check, no waiting — just over-collateralised loans.',
    },
    {
        icon: <Shield size={22} className="text-[#FFB800]" />,
        title: 'Monitor your Health Factor',
        description:
            'Your Health Factor shows how safe your loan is. Keep it above 1.0 to avoid liquidation. Watch it update in real-time as you type amounts.',
    },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-lg"
            >
                <GlassCard className="relative border border-[#00F0FF]/20 glass-panel-strong">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#0072FF] mb-4 shadow-[0_4px_20px_rgba(0,198,255,0.4)]">
                            <Zap size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome to QuickLend</h2>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto">
                            Supply tokens, earn interest, and borrow against your crypto — all in a few clicks.
                        </p>
                    </div>

                    <div className="space-y-3 mb-8">
                        {STEPS.map((step, i) => (
                            <div
                                key={i}
                                className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    {step.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm mb-1">
                                        <span className="text-gray-500 mr-2">{i + 1}.</span>
                                        {step.title}
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button fullWidth size="lg" variant="primary" onClick={onClose}>
                        Get Started
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                        Non-custodial · Open source · Audited
                    </p>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};
