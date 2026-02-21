'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { CheckCircle, Loader2, XCircle, Info, X } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
    pending: <Loader2 size={18} className="animate-spin text-[#00C6FF]" />,
    success: <CheckCircle size={18} className="text-[#42e695]" />,
    error: <XCircle size={18} className="text-[#FF4B4B]" />,
    info: <Info size={18} className="text-[#00C6FF]" />,
};

const BORDER_COLORS: Record<string, string> = {
    pending: 'border-[#00C6FF]/30',
    success: 'border-[#42e695]/30',
    error: 'border-[#FF4B4B]/30',
    info: 'border-[#00C6FF]/30',
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={`pointer-events-auto flex items-start gap-3 bg-[#0B0E11]/95 backdrop-blur-sm border ${BORDER_COLORS[toast.type]} rounded-xl p-4 shadow-2xl min-w-[280px] max-w-[360px]`}
                    >
                        <div className="mt-0.5 flex-shrink-0">{ICONS[toast.type]}</div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-white">{toast.title}</div>
                            {toast.message && (
                                <div className="text-xs text-gray-400 mt-1">{toast.message}</div>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
