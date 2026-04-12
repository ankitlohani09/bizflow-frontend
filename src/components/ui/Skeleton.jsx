import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Skeleton – Modern loading placeholder
 * 
 * @param {string} className - Tailwind classes for size and shape
 */
export default function Skeleton({ className }) {
    return (
        <div 
            className={cn(
                "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", 
                className
            )} 
        />
    );
}

/** Predefined skeleton variants */
export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-sm bg-white dark:bg-slate-900">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 flex-1" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}
