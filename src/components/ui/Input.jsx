import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Modern Input component with refined borders and focus effects
 */
const Input = React.forwardRef(({ className, type = 'text', label, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold tracking-tight transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
