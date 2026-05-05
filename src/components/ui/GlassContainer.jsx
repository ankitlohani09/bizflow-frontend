import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * A reusable glassmorphic container for premium UI sections
 */
const GlassContainer = ({ children, className, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'glass-card rounded-[2.5rem] p-8 relative overflow-hidden group',
        className
      )}
      {...props}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-colors duration-700" />

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassContainer;
