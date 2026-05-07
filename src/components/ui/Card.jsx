import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Modern Card component with premium aesthetics
 */
const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'enterprise-card overflow-hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6 border-b border-slate-50 dark:border-slate-800/50', className)}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3
    className={cn('text-lg font-black leading-none tracking-tight text-slate-900 dark:text-white uppercase', className)}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }) => (
  <p
    className={cn('text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest', className)}
    {...props}
  >
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
