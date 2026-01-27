import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, animate = true, ...props }) => {
  const Component = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
    whileHover: { 
        y: -5, 
        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.05)"
    }
  } : {};

  return (
    // @ts-ignore
    <Component 
      className={cn(
        "glass-panel rounded-2xl p-6 transition-all duration-300",
        className
      )}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};
