import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, ChevronRight, Check } from 'lucide-react';
import inventoryService from '../services/inventoryService';
import invoiceService from '../services/invoiceService';
import { cn } from '../utils/cn';

/**
 * NotificationCenter – Real-time alerts for inventory and payments
 */
export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchAlerts = async () => {
        try {
            const [items, invoices] = await Promise.all([
                inventoryService.getAll(),
                invoiceService.getAll()
            ]);

            const alerts = [
                ...items.filter(it => (it.availableQty || 0) <= (it.lowStockThreshold || 5))
                    .map(it => ({
                        id: `stock-${it.id}`,
                        type: 'LOW_STOCK',
                        title: 'Low Stock Alert',
                        message: `${it.itemName || 'Product'} is down to ${it.availableQty} units.`,
                        icon: AlertTriangle,
                        color: 'text-amber-500',
                        bgColor: 'bg-amber-50'
                    })),
                ...invoices.filter(inv => (inv.paymentStatus || inv.status) === 'PENDING')
                    .map(inv => ({
                        id: `pay-${inv.id}`,
                        type: 'PENDING_PAYMENT',
                        title: 'Pending Payment',
                        message: `Invoice ${inv.invoiceNumber || ('#INV-' + inv.id)} for ${inv.customerName || 'Walk-in'} is unpaid.`,
                        icon: Clock,
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-50'
                    }))
            ];

            setNotifications(alerts);
        } catch (err) {
            console.error('Notification fetch error:', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800",
                    isOpen && "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                )}
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Notifications</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800">
                            {notifications.length} NEW
                        </span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center opacity-40">
                                <Bell size={32} className="mx-auto mb-2" />
                                <p className="text-sm font-medium">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="group relative flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className={cn("mt-0.5 rounded-lg p-1.5", n.bgColor)}>
                                        <n.icon size={16} className={n.color} />
                                    </div>
                                    <div className="flex-1 pr-6">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{n.message}</p>
                                    </div>
                                    <button
                                        onClick={() => markAsRead(n.id)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/stock-movements');
                            }}
                            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors dark:border-slate-800 dark:hover:bg-blue-500/5"
                        >
                            VIEW ALL ACTIVITY <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
