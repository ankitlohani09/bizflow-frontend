import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Alert – inline feedback banner
 *
 * Props:
 *   variant  {string}  – 'error' | 'success' | 'warning' | 'info'
 *   message  {string}  – text to display
 *   onClose  {function} – optional; if provided, renders a dismiss button
 *   className {string}  – optional extra classes
 */
export default function Alert({ variant = 'error', message, onClose, className }) {
    if (!message) return null;

    const styles = {
        error:   'border-rose-200 bg-rose-50 text-rose-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        info:    'border-blue-200 bg-blue-50 text-blue-700',
    };

    const Icon = variant === 'success' ? CheckCircle : AlertCircle;

    return (
        <div
            role="alert"
            className={cn(
                'flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm',
                styles[variant] ?? styles.info,
                className
            )}
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-auto shrink-0 opacity-70 hover:opacity-100"
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
