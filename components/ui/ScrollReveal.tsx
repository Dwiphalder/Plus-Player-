import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className, delay = 0 }) => {
  const { isPremium } = useSettings();

  if (!isPremium) {
    // Return static div if not premium
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: false, margin: "-10%" }} 
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: delay }}
    >
      {children}
    </motion.div>
  );
};