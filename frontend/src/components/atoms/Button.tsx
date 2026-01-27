import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white shadow-[0_4px_15px_rgba(0,198,255,0.3)] hover:shadow-[0_6px_20px_rgba(0,198,255,0.4)] border border-transparent',
    secondary: 'bg-gradient-to-r from-[#42e695] to-[#3bb2b8] text-black font-semibold hover:shadow-[0_6px_20px_rgba(66,230,149,0.3)]',
    danger: 'bg-gradient-to-r from-[#FF4B4B] to-[#FF416C] text-white hover:shadow-[0_6px_20px_rgba(255,75,75,0.3)]',
    ghost: 'bg-white/5 text-[#00C6FF] hover:bg-white/10 border border-white/10 backdrop-blur-md',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-bold',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl font-medium transition-all duration-200 flex items-center justify-center",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
