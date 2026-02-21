'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span className={`relative inline-flex items-center ml-1 ${className}`}>
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="More information"
            >
                <HelpCircle size={14} />
            </button>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-[100] pointer-events-none"
                    >
                        <div className="bg-[#1A1D23] border border-white/10 rounded-lg p-3 text-xs text-gray-300 leading-relaxed shadow-xl text-left">
                            {content}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1D23] -mt-px" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
};
