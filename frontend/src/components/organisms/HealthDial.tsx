import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/atoms/GlassCard';
import { cn } from '@/lib/utils';

interface HealthDialProps {
  healthFactor: number;
  className?: string;
}

export const HealthDial: React.FC<HealthDialProps> = ({ healthFactor, className }) => {
  // Map HF to Angle (-90 to 90)
  // Range: 0.8 to 4.0 visually
  // HF < 1.0 is Danger
  
  const MAX_HF = 4.0;
  const clampedHF = Math.min(Math.max(healthFactor, 0), MAX_HF);
  
  // -90 deg is 0 HF
  // +90 deg is MAX_HF
  // angle = (HF / MAX_HF) * 180 - 90
  const angle = (clampedHF / MAX_HF) * 180 - 90;

  const getStatusColor = (hf: number) => {
    if (hf < 1.1) return 'text-[#FF4B4B]'; // Danger
    if (hf < 1.5) return 'text-[#FFB800]'; // Warning
    return 'text-gradient-success bg-clip-text text-transparent'; // Good (Gradient)
  };

  const statusColor = getStatusColor(healthFactor);

  return (
    <GlassCard className={cn("flex flex-col items-center justify-center relative overflow-hidden glass-panel-strong", className)}>
      <div className="relative w-64 h-32 mt-4">
        {/* Background Arc */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
            <defs>
                <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4B4B" />
                    <stop offset="40%" stopColor="#FFB800" />
                    <stop offset="100%" stopColor="#42e695" />
                </linearGradient>
            </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#dialGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset="0"
          />
        </svg>

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-1 h-32 origin-bottom bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          initial={{ rotate: -90 }}
          animate={{ rotate: angle }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
          style={{ zIndex: 10, marginLeft: '-2px' }} // Center the 4px width
        />
        
        {/* Center Hub */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-[#161A1E] border-2 border-white rounded-full transform -translate-x-1/2 translate-y-1/2 z-20" />
      </div>

      <div className="text-center mt-6">
        <div className="text-sm text-gray-400 font-sans uppercase tracking-widest mb-1">Health Factor</div>
        <motion.div 
            className={cn("text-6xl font-mono font-bold tracking-tighter", statusColor)}
            key={healthFactor}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
          {healthFactor > 100 ? '∞' : healthFactor.toFixed(2)}
        </motion.div>
        <div className="text-xs text-gray-500 mt-2 font-medium">
            Liquidation at &lt; 1.0
        </div>
      </div>
    </GlassCard>
  );
};
