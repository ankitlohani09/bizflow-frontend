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
    AlertCircle
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sum, enh, invs] = await Promise.all([
                reportService.getFinancialSummary(),
                reportService.getEnhancedAnalytics(),
                invoiceService.getAll()
            ]);
            setSummary(sum);
            setAnalytics(enh);
            setRecentInvoices(invs.slice(0, 5));
        } catch (err) {
            setError(err.message ?? 'Failed to load executive summary.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <MainLayout title="Executive Overview">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Executive Pulse</h1>
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
                        <DashboardStat
                            title="Revenue"
                            value={fmt(summary?.revenue)}
                            icon={TrendingUp}
                            color="blue"
                            trend="+12.5%"
                        />
                        <DashboardStat
                            title="Operational Cost"
                            value={fmt(summary?.costs)}
                            icon={TrendingDown}
                            color="rose"
                            trend="-4.2%"
                        />
                        <DashboardStat
                            title="Net Profit"
                            value={fmt(summary?.netProfit)}
                            icon={ArrowUpRight}
                            color="emerald"
                            trend="+18.3%"
                        />
                        <DashboardStat
                            title="Low Stock"
                            value={analytics?.topItems.filter(i => i.quantity < 10).length || 0}
                            icon={AlertCircle}
                            color="amber"
                            isWarning={true}
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
                                {analytics?.topItems.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-32">{item.name}</span>
                                            <span className="text-[10px] font-black text-blue-500">{item.quantity} units</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

                    {/* Recent Invoices */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 p-6">
                            <div>
                                <CardTitle className="dark:text-white uppercase tracking-tighter text-sm font-black text-slate-400">Recent Ledger</CardTitle>
                                <CardDescription className="dark:text-slate-400 font-medium">Latest billing transactions</CardDescription>
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
                                            <TableCell className="font-bold text-slate-900 dark:text-slate-200 pl-6">#INV-{invoice.id}</TableCell>
                                            <TableCell className="text-slate-500 dark:text-slate-400 font-medium">{invoice.customerName || 'Walk-in'}</TableCell>
                                            <TableCell className="font-black text-slate-900 dark:text-white">{fmt(invoice.totalAmount)}</TableCell>
                                            <TableCell className="pr-6"><StatusBadge status={invoice.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
}

function DashboardStat({ title, value, icon: Icon, color, trend, isWarning }) {
    const colors = {
        blue: 'bg-blue-50/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100/50 dark:border-blue-500/20',
        rose: 'bg-rose-50/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100/50 dark:border-rose-500/20',
        emerald: 'bg-emerald-50/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20',
        amber: 'bg-amber-50/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/20',
    };

    return (
        <Card className={cn(
            "glass-card group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 rounded-3xl",
            isWarning && "ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/5"
        )}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("glow-icon flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:rotate-6", colors[color])}>
                        <Icon size={26} />
                    </div>
                    {trend && (
                        <span className={cn(
                            "text-[10px] font-black px-3 py-1.5 rounded-full border tracking-wider",
                            trend.startsWith('+') ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50" : "bg-rose-50/50 text-rose-600 border-rose-100/50"
                        )}>
                            {trend}
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</h3>
                </div>
                
                {/* Decorative background glow */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            </CardContent>
        </Card>
    );
}
