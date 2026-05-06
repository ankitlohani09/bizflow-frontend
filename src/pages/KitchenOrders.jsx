import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChefHat, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ChevronRight, 
    Search,
    Filter,
    UtensilsCrossed
} from 'lucide-react';
import kitchenOrderService from '../services/kitchenOrderService';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    PREPARING: { label: 'Preparing', color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', icon: ChefHat },
    READY: { label: 'Ready', color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
    DELIVERED: { label: 'Delivered', color: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', icon: AlertCircle },
};

export default function KitchenOrders() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await kitchenOrderService.getAll(filter === 'ALL' ? null : filter);
            setOrders(data || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Poll for new orders every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [filter]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await kitchenOrderService.updateStatus(orderId, newStatus);
            fetchOrders();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UtensilsCrossed className="text-primary" size={32} />
                        {t('Kitchen Orders')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage real-time kitchen tickets and order flow.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        {['ALL', 'PENDING', 'PREPARING', 'READY'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                    filter === s 
                                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            {loading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse">Syncing Kitchen Board...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xl shadow-slate-100 dark:shadow-none">
                    <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <ChefHat size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Orders</h3>
                    <p className="text-slate-500 mt-2">All caught up! New orders will appear here automatically.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {orders.map((order) => {
                            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col"
                                >
                                    {/* Card Header */}
                                    <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                                                #{order.id.toString().slice(-3)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Table</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{order.tableName || 'Takeaway'}</p>
                                            </div>
                                        </div>
                                        <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5", config.light, config.text)}>
                                            <Icon size={12} />
                                            {config.label}
                                        </div>
                                    </div>

                                    {/* Card Content - Items List */}
                                    <div className="p-5 flex-1 space-y-3">
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center text-slate-600">
                                                        {item.quantity}x
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.itemName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer / Actions */}
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                                        {order.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleStatusChange(order.id, 'PREPARING')}
                                                className="w-full h-11 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                            >
                                                Start Cooking <ChevronRight size={16} />
                                            </button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <button 
                                                onClick={() => handleStatusChange(order.id, 'READY')}
                                                className="w-full h-11 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                            >
                                                Mark as Ready <CheckCircle2 size={16} />
                                            </button>
                                        )}
                                        {order.status === 'READY' && (
                                            <button 
                                                onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                                                className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                                            >
                                                Mark Delivered <CheckCircle2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
