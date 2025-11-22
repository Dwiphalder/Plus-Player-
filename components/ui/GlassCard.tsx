import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'neon' | 'highlight';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, variant = 'dark', ...props }) => {
  const baseStyles = "rounded-2xl backdrop-blur-xl border shadow-lg transition-all duration-300";
  
  const variants = {
    light: "bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-900 dark:text-white",
    dark: "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-white/90 dark:hover:bg-slate-900/80 shadow-slate-200/50 dark:shadow-black/50",
    neon: "bg-slate-900/90 border-purple-500/50 shadow-purple-500/20 text-white",
    highlight: "bg-primary/10 dark:bg-primary/20 border-primary/20 text-primary-900 dark:text-white",
  };

  return (
    <div className={twMerge(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

export const NeonButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ 
  children, className, active, ...props 
}) => {
  return (
    <motion.button 
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={twMerge(
        "p-3 rounded-full transition-colors duration-300 flex items-center justify-center",
        active 
          ? "bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]" 
          : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}