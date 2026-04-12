import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Enhanced Card component for Dashboard and Layouts
 */
function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-slate-900',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-slate-500', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
