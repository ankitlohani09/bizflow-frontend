import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    RefreshCw,
    ReceiptText,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    AlertCircle,
    Sparkles,
    Lightbulb,
    ShieldAlert,
    Hourglass,
    Package
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';
import reportService from '../services/reportService';
import invoiceService from '../services/invoiceService';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import GlassContainer from '../components/ui/GlassContainer';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

function StatusBadge({ status }) {
    const s = (status || '').toUpperCase();
    const styles = {
        PAID: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        VOID: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        PARTIAL: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest',
            styles[s] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        )}>
            {status || 'Unknown'}
        </span>
    );
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [insights, setInsights] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sum, enh, invs, ai] = await Promise.all([
                reportService.getFinancialSummary(),
                reportService.getEnhancedAnalytics(),
                invoiceService.getAll(),
                reportService.getSmartInsights()
            ]);
            setSummary(sum);
            setAnalytics(enh);
            setRecentInvoices(invs.slice(0, 5));
            setInsights(ai);
        } catch {
            setError('Failed to load store summary.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <MainLayout>
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Store Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Sales & Stock Summary</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-2xl border-slate-200">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl px-6"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <ReceiptText className="h-4 w-4" /> New Bill
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : error ? (
                <div className="rounded-[2.5rem] border border-rose-100 bg-rose-50/50 p-12 text-center backdrop-blur-xl dark:bg-rose-950/10 dark:border-rose-900/20">
                    <AlertCircle className="mx-auto h-16 w-16 text-rose-500 opacity-20" />
                    <h3 className="mt-6 text-xl font-black text-rose-900 dark:text-rose-400 tracking-tight uppercase">Intelligence Failure</h3>
                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-500 font-bold uppercase tracking-wider">{error}</p>
                    <Button variant="primary" onClick={fetchData} className="mt-8 bg-rose-600 hover:bg-rose-700 shadow-rose-500/20">
                        Reconnect to Network
                    </Button>
                </div>
            ) : (
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-10"
                >
                    {/* Metrics Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total Sales"
                            value={fmt(summary?.revenue)}
                            icon={TrendingUp}
                            colorClass="icon-box-blue"
                            subtitle={`${recentInvoices.length} invoices registered`}
                        />
                        <MetricCard
                            title="Total Expenses"
                            value={fmt(summary?.expenses)}
                            icon={TrendingDown}
                            colorClass="icon-box-rose"
                            subtitle={`${summary?.expenseCount || 0} expense records`}
                        />
                        <MetricCard
                            title="Net Profit"
                            value={fmt(summary?.netProfit)}
                            icon={ArrowUpRight}
                            colorClass="icon-box-emerald"
                            subtitle="On track for Q2"
                        />
                        <MetricCard
                            title="Low Stock"
                            value={analytics?.topItems?.filter(i => i.quantity < 10).length || 0}
                            icon={AlertCircle}
                            colorClass="icon-box-amber"
                            subtitle={`of ${analytics?.topItems?.length || 0} items`}
                        />
                    </div>

                    {/* AI Advisor Section - Solid Dark for Maximum Readability & Premium Feel */}
                    {insights.length > 0 && (
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <Sparkles size={160} className="text-indigo-400" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                            <Lightbulb className="text-indigo-400" size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm leading-tight">BizFlow AI Advisor</h3>
                                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Smart Insights Engine v2.0</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Neural Analysis Live</span>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {insights.map((insight, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileHover={{ y: -5 }}
                                            className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 shadow-xl"
                                        >
                                            <div className="flex items-start gap-6">
                                                <div className={cn(
                                                    "p-3 rounded-xl shrink-0",
                                                    insight.type === 'POSITIVE' ? "bg-emerald-500/20 text-emerald-400" :
                                                    insight.type === 'WARNING' ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-rose-500/20 text-rose-400"
                                                )}>
                                                    {insight.type === 'POSITIVE' ? <TrendingUp size={22} /> :
                                                     insight.type === 'WARNING' ? <ShieldAlert size={22} /> :
                                                     <AlertCircle size={22} />}
                                                </div>
                                                <div>
                                                    <p className="text-slate-100 text-[15px] font-bold leading-relaxed tracking-tight">{insight.text}</p>
                                                    <div className="mt-5 flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">{insight.category}</span>
                                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Confidence: {(insight.relevance * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart Row */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                                <CardTitle className="text-indigo-600 dark:text-indigo-400">Sales Graph</CardTitle>
                                <CardDescription>Sales performance over time</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.monthlyData}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                                tickFormatter={(val) => `₹${val / 1000}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '24px',
                                                    border: 'none',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    backdropFilter: 'blur(12px)',
                                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
                                                }}
                                                itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#6366f1"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorRev)"
                                                animationDuration={2500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                                <CardTitle className="text-indigo-600 dark:text-indigo-400">Best Selling Items</CardTitle>
                                <CardDescription>Top moving stock</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8">
                                {(analytics?.topItems || []).slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate w-40">{item.name}</span>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.quantity} Units</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.quantity / (analytics?.topItems[0]?.quantity || 1)) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.1 }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Invoices */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-50 dark:border-slate-800/50">
                            <div>
                                <CardTitle className="text-indigo-600 dark:text-indigo-400">Recent Bills</CardTitle>
                                <CardDescription>Latest sales activities</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="text-indigo-600 font-black tracking-widest uppercase text-[10px]">View History</Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-transparent border-none">
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-8 h-12">Bill No.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-12">Customer</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-12">Amount</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pr-8 h-12 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentInvoices.map((invoice) => (
                                        <TableRow key={invoice.id} className="dark:hover:bg-slate-800/30 border-slate-50 dark:border-slate-800/50 group h-16">
                                            <TableCell className="font-black text-slate-900 dark:text-slate-200 pl-8">
                                                {invoice.invoiceNumber || (`#INV-${invoice.id}`)}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-tight">{invoice.customerName || 'Direct Sale'}</TableCell>
                                            <TableCell className="font-black text-slate-900 dark:text-white tabular-nums">{fmt(invoice.grandTotal || invoice.totalAmount || 0)}</TableCell>
                                            <TableCell className="pr-8 text-right"><StatusBadge status={invoice.paymentStatus || invoice.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </MainLayout>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, colorClass }) {
    return (
        <motion.div variants={item}>
            <Card className="p-8 group hover:border-indigo-500/20 transition-all duration-500 bg-white dark:bg-slate-900 shadow-xl border-none">
                <div className="flex items-center gap-6">
                    <div className={cn("transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg", colorClass)}>
                        <Icon size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{subtitle}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
