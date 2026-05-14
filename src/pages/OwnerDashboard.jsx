import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    LayoutDashboard,
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
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[14px] font-semibold uppercase tracking-widest',
            styles[s] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        )}>
            {status || 'Unknown'}
        </span>
    );
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    const { t } = useTranslation();
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
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Store Dashboard</h1>
                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Daily Sales & Stock Summary
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-2xl border-slate-200">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl px-6"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <ReceiptText className="h-4 w-4" /> Create New Invoice
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
                    <h3 className="mt-6 text-xl font-semibold text-rose-900 dark:text-rose-400 tracking-tight uppercase">Intelligence Failure</h3>
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
                            subtitle={`${recentInvoices.length} invoices registered`}
                        />
                        <MetricCard
                            title="Total Expenses"
                            value={fmt(summary?.costs)}
                            icon={TrendingDown}
                            subtitle={`${summary?.breakdown?.expenses || 0} expense records`}
                        />
                        <MetricCard
                            title="Net Profit"
                            value={fmt(summary?.netProfit)}
                            icon={ArrowUpRight}
                            subtitle="On track for Q2"
                        />
                        <MetricCard
                            title="Low Stock"
                            value={summary?.lowStockCount || 0}
                            icon={AlertCircle}
                            subtitle={`of ${summary?.totalItems || 0} items`}
                        />
                    </div>

                    {/* AI Advisor Section - Solid Dark for Maximum Readability & Premium Feel */}
                    {insights.length > 0 && (
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100/50 dark:border-slate-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <Sparkles size={160} className="text-indigo-500 dark:text-indigo-400" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                                            <Lightbulb className="text-indigo-600 dark:text-indigo-400" size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 dark:text-white font-semibold uppercase tracking-[0.2em] text-sm leading-tight">{t("Smart Business Tips")}</h3>
                                            <p className="text-indigo-600 dark:text-indigo-400 text-[14px] font-semibold uppercase tracking-[0.3em] mt-1">{t("AI Powered Advice")}</p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex px-5 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full">
                                        <span className="text-[14px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">Neural Analysis Live</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

                                    <div className="space-y-8">
                                        {insights.map((insight, idx) => {
                                            const isHero = idx === 0;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ x: 5 }}
                                                    className="relative pl-10 sm:pl-16"
                                                >
                                                    {/* Timeline Node */}
                                                    {isHero ? (
                                                        <div className="absolute left-[0.8rem] top-1.5 h-5 w-5 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-pulse" />
                                                    ) : (
                                                        <div className={cn(
                                                            "absolute left-[1.1rem] top-2 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                                                            insight.type === 'POSITIVE' ? "bg-emerald-500" :
                                                                insight.type === 'WARNING' ? "bg-amber-500" :
                                                                    "bg-rose-500"
                                                        )} />
                                                    )}

                                                    {/* Insight Card */}
                                                    <div className={cn(
                                                        "border transition-all duration-300 shadow-xl backdrop-blur-md p-6 rounded-2xl",
                                                        isHero
                                                            ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/30 hover:border-indigo-200 dark:hover:border-indigo-500/50"
                                                            : "bg-white dark:bg-indigo-500/5 border-slate-100 dark:border-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-100 dark:hover:border-indigo-500/20"
                                                    )}>
                                                        <div className="flex items-start gap-4">
                                                            <div className={cn(
                                                                "p-2.5 rounded-lg shrink-0",
                                                                insight.type === 'POSITIVE' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                                                                    insight.type === 'WARNING' ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                                                                        "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                                            )}>
                                                                {insight.type === 'POSITIVE' ? <TrendingUp size={isHero ? 22 : 18} /> :
                                                                    insight.type === 'WARNING' ? <ShieldAlert size={isHero ? 22 : 18} /> :
                                                                        <AlertCircle size={isHero ? 22 : 18} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <p className={cn(
                                                                        "text-slate-800 dark:text-slate-100 font-bold leading-relaxed tracking-tight",
                                                                        isHero ? "text-[16px]" : "text-[14px]"
                                                                    )}>
                                                                        {t(insight.textKey, insight.params)}
                                                                    </p>
                                                                    {isHero && (
                                                                        <span className="text-[14px] font-semibold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest ml-2 shrink-0">Top Tip</span>
                                                                    )}
                                                                </div>
                                                                <div className="mt-4 flex items-center justify-between">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                                        <span className="text-[14px] font-semibold text-indigo-600/60 dark:text-indigo-400/60 uppercase tracking-widest">{insight.category}</span>
                                                                        <div className="hidden sm:block h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                                        <span className="text-[14px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Confidence: {(insight.relevance * 100).toFixed(0)}%</span>
                                                                    </div>
                                                                    <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className={cn(
                                                                            "h-full rounded-full",
                                                                            insight.type === 'POSITIVE' ? "bg-emerald-500" :
                                                                                insight.type === 'WARNING' ? "bg-amber-500" :
                                                                                    "bg-rose-500"
                                                                        )} style={{ width: `${insight.relevance * 100}%` }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart Row */}
                    <div className="grid gap-8 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border border-slate-100/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
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
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                                                name="Sales"
                                                stroke="#6366f1"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorRev)"
                                                animationDuration={2500}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="expenses"
                                                name="Expenses"
                                                stroke="#ef4444"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorExp)"
                                                animationDuration={2500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-100/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:border-indigo-500/20 transition-all duration-500">
                            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800/50">
                                <CardTitle className="text-indigo-600 dark:text-indigo-400">Best Selling Items</CardTitle>
                                <CardDescription>Top moving stock</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="h-[200px] w-full mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics?.topItems?.map(i => ({ name: i.name, value: i.quantity })) || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {(analytics?.topItems || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    backdropFilter: 'blur(12px)',
                                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-6">
                                    {(analytics?.topItems || []).slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate w-40">{item.name}</span>
                                                </div>
                                                <span className="text-[14px] font-semibold text-indigo-500 uppercase tracking-widest">{item.quantity} Units</span>
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
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Invoices */}
                    <Card className="border border-slate-100/50 dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:border-indigo-500/20 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-slate-50 dark:border-slate-800/50">
                            <div>
                                <CardTitle className="text-indigo-600 dark:text-indigo-400">Recent Bills</CardTitle>
                                <CardDescription>Latest sales activities</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="text-indigo-600 font-semibold tracking-widest uppercase text-[14px]">View History</Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-transparent border-none">
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 pl-8 h-12">Bill No.</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 h-12">Customer</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 h-12">Amount</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 pr-8 h-12 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentInvoices.map((invoice) => (
                                        <TableRow key={invoice.id} className="dark:hover:bg-indigo-500/5 border-slate-50 dark:border-slate-800/50 group h-16 transition-colors duration-300">
                                            <TableCell className="font-semibold text-slate-900 dark:text-slate-200 pl-8">
                                                {invoice.invoiceNumber || (`#INV-${invoice.id}`)}
                                            </TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-tight">{invoice.customerName || 'Walk-In Customer'}</TableCell>
                                            <TableCell className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmt(invoice.grandTotal || invoice.totalAmount || 0)}</TableCell>
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

function MetricCard({ title, value, subtitle, icon: Icon }) {
    return (
        <motion.div variants={item}>
            <Card className="p-8 group hover:border-indigo-500/30 transition-all duration-500 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100/50 dark:border-slate-800/50 rounded-[2rem]">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg flex items-center justify-center",
                        title === "Total Sales" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" :
                            title === "Total Expenses" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                title === "Net Profit" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <p className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                        <h3 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter tabular-nums">{value}</h3>
                        <p className="text-[14px] font-semibold uppercase tracking-widest text-indigo-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{subtitle}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
