import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * Reusable Button component with modern aesthetics and motion
 */
const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export default Button;
