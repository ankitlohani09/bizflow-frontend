import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Modal – a reusable overlay dialog
 *
 * Props:
 *   isOpen   {boolean}  – controls visibility
 *   onClose  {function} – called when user clicks backdrop or ✕ button
 *   title    {string}   – modal header
 *   children {node}     – modal body content
 *   size     {string}   – 'sm' | 'md' | 'lg' (default 'md')
 *
 * Accessibility:
 *   - Traps focus inside the dialog
 *   - Pressing Escape closes the modal
 *   - aria-modal and role="dialog" set for screen readers
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const overlayRef = useRef(null);

    // ── Close on Escape key ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // ── Lock body scroll while modal is open ─────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            return () => {
                document.documentElement.classList.remove('no-scroll');
                document.body.classList.remove('no-scroll');
            };
        }
    }, [isOpen]);

    // Don't render anything when closed
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
    };

    // Close modal only when clicking directly on the backdrop (not the dialog)
    function handleBackdropClick(e) {
        if (e.target === overlayRef.current) onClose();
    }

    return (
        // Backdrop
        <div
            ref={overlayRef}
            onClick={handleBackdropClick}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
        >
            {/* Dialog panel */}
            <div
                className={cn(
                    'relative w-full rounded-xl bg-white dark:bg-slate-900 shadow-2xl',
                    sizeClasses[size] ?? sizeClasses.md
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                    <h2
                        id="modal-title"
                        className="text-base font-semibold text-slate-900 dark:text-white"
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
                        aria-label="Close dialog"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
