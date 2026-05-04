import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
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
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

function StatusBadge({ status }) {
    const s = (status || '').toUpperCase();
    const styles = {
        PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
        VOID: 'bg-rose-50 text-rose-700 border-rose-100',
        PARTIAL: 'bg-blue-50 text-blue-700 border-blue-100',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
            styles[s] ?? 'bg-slate-50 text-slate-500 border-slate-100'
        )}>
            {status || 'Unknown'}
        </span>
    );
}

function ErrorBanner({ message, onRetry }) {
    return (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500 opacity-20" />
            <h3 className="mt-4 text-lg font-black text-rose-900 tracking-tighter uppercase">Intelligence Failure</h3>
            <p className="mt-1 text-sm text-rose-600 font-medium">{message}</p>
            <Button variant="outline" onClick={onRetry} className="mt-6 bg-white border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl font-bold">
                Reconnect to Network
            </Button>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [insights, setInsights] = useState([]);
    const [predictions, setPredictions] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sum, enh, invs, ai, pred] = await Promise.all([
                reportService.getFinancialSummary(),
                reportService.getEnhancedAnalytics(),
                invoiceService.getAll(),
                reportService.getSmartInsights(),
                reportService.getPredictiveInventory()
            ]);
            setSummary(sum);
            setAnalytics(enh);
            setRecentInvoices(invs.slice(0, 5));
            setInsights(ai);
            setPredictions(pred.slice(0, 4));
        } catch {
            setError('Failed to load executive summary.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <MainLayout title="Executive Overview">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Real-time financial and operational health metrics.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchData} disabled={loading} className="dark:text-slate-400 font-bold">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <ReceiptText className="h-4 w-4" /> New Invoice
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : error ? (
                <ErrorBanner message={error} onRetry={fetchData} />
            ) : (
                <div className="space-y-8">
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
                            subtitle="On track"
                        />
                        <MetricCard
                            title="Low Stock Items"
                            value={analytics?.topItems?.filter(i => i.quantity < 10).length || 0}
                            icon={AlertCircle}
                            colorClass="icon-box-amber"
                            subtitle={`of ${analytics?.topItems?.length || 0} total items`}
                        />
                    </div>

                    {/* Chart Row */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 p-6 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="dark:text-white uppercase tracking-tighter text-sm font-black text-slate-400">Revenue Growth</CardTitle>
                                <CardDescription className="dark:text-slate-400 font-medium">Monthly sales performance trend</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80 pt-6 pr-6">
                                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                                    <AreaChart data={analytics?.monthlyData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                            tickFormatter={(val) => `₹${val / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(12px)',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRev)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 p-6 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="dark:text-white uppercase tracking-tighter text-sm font-black text-slate-400">Top Selling</CardTitle>
                                <CardDescription className="dark:text-slate-400 font-medium">Inventory performance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {(analytics?.topItems || []).slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-700 truncate w-32">{item.name}</span>
                                            <span className="text-[10px] font-black text-blue-500">{item.quantity} units</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(item.quantity / (analytics?.topItems[0]?.quantity || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Advisor Section */}
                    {insights.length > 0 && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <Card className="border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                        <Sparkles size={120} className="text-blue-400" />
                                    </div>
                                    <div className="relative bg-slate-900/50 backdrop-blur-3xl rounded-[2.4rem] p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                                    <Lightbulb className="text-blue-400" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-black uppercase tracking-widest text-sm">BizFlow AI Advisor</h3>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Phase 1: Smart Insights Engine</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Live Analysis</span>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            {insights.map((insight, idx) => (
                                                <div key={idx} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl group hover:border-blue-500/30 transition-all">
                                                    <div className="flex items-start gap-4">
                                                        <div className={cn(
                                                            "p-2 rounded-xl shrink-0 mt-1",
                                                            insight.type === 'POSITIVE' ? "bg-emerald-500/10 text-emerald-400" :
                                                            insight.type === 'WARNING' ? "bg-amber-500/10 text-amber-400" :
                                                            "bg-rose-500/10 text-rose-400"
                                                        )}>
                                                            {insight.type === 'POSITIVE' ? <TrendingUp size={16} /> :
                                                             insight.type === 'WARNING' ? <ShieldAlert size={16} /> :
                                                             <AlertCircle size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-200 text-sm font-bold leading-relaxed">{insight.text}</p>
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{insight.category}</span>
                                                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Confidence: {(insight.relevance * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Recent Invoices */}
                    <Card className="enterprise-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 p-6">
                            <div>
                                <CardTitle className="text-slate-900 border-none font-bold">Recent Invoices</CardTitle>
                                <CardDescription>Latest {recentInvoices.length} records from your backend</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="text-blue-500 font-bold hover:bg-blue-50">View All</Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <div className="min-w-[600px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-transparent hover:bg-transparent border-none">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Invoice</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentInvoices.map((invoice) => (
                                            <TableRow key={invoice.id} className="dark:hover:bg-slate-800/50 dark:border-slate-800/50 border-slate-50">
                                                <TableCell className="font-bold text-slate-900 dark:text-slate-200 pl-6">
                                                    {invoice.invoiceNumber || (`#INV-${invoice.id}`)}
                                                </TableCell>
                                                <TableCell className="text-slate-500 dark:text-slate-400 font-medium">{invoice.customerName || 'Walk-in'}</TableCell>
                                                <TableCell className="font-black text-slate-900 dark:text-white">{fmt(invoice.grandTotal || invoice.totalAmount || 0)}</TableCell>
                                                <TableCell className="pr-6"><StatusBadge status={invoice.paymentStatus || invoice.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Smart Inventory Reorders (AI Phase 2) */}
                    <Card className="glass-card premium-shadow rounded-3xl overflow-hidden border-none transition-all duration-300">
                        <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Hourglass className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Smart Reorder Alerts</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-900 dark:text-white">Predictive Stock Management</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {predictions.length === 0 ? (
                                    <div className="p-12 text-center opacity-30 italic text-sm">No predictive data available.</div>
                                ) : (
                                    predictions.map((p, i) => (
                                        <div key={i} className="p-6 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm leading-none">{p.itemName}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Velocity: {p.dailyVelocity} units / day</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    p.status === 'CRITICAL' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                    p.status === 'WARNING' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                    "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                )}>
                                                    Stockout in {p.daysRemaining} days
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Available: {p.availableQty}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 text-center">
                                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 w-full">Update Logistics Plan</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, colorClass }) { // eslint-disable-line no-unused-vars
    return (
        <Card className="enterprise-card h-full p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-6">
                <div className={cn("p-4 rounded-2xl shrink-0", colorClass)}>
                    <Icon size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{value}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{subtitle}</p>
                </div>
            </div>
        </Card>
    );
}
