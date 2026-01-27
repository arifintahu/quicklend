import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TickerNumberProps {
  value: string | number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const TickerNumber: React.FC<TickerNumberProps> = ({ value, className, prefix = '', suffix = '' }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    if (value !== prevValue) {
        // Simple heuristic: compare numbers if possible
        const currentNum = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
        const prevNum = parseFloat(String(prevValue).replace(/[^0-9.-]+/g, ""));
        
        if (!isNaN(currentNum) && !isNaN(prevNum)) {
            if (currentNum > prevNum) setDirection('up');
            else if (currentNum < prevNum) setDirection('down');
            else setDirection('neutral');
        }

        setPrevValue(value);
        
        // Reset direction after flash
        const timer = setTimeout(() => setDirection('neutral'), 1000);
        return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const getFlashColor = () => {
      if (direction === 'up') return 'text-[#00FF41]';
      if (direction === 'down') return 'text-[#FF4B4B]';
      return '';
  };

  return (
    <div className={cn("inline-flex items-center transition-colors duration-300", getFlashColor(), className)}>
      <span>{prefix}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
            key={String(value)}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-block"
        >
            {value}
        </motion.span>
      </AnimatePresence>
      <span>{suffix}</span>
    </div>
  );
};
