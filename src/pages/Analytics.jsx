import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Activity,
    Target,
    Package,
    ArrowRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    Cell,
} from 'recharts';
import reportService from '../services/reportService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ title, value, subtitle, trend, icon: Icon, colorClass }) {
    const isPositive = trend >= 0;
    return (
        <Card className="enterprise-card h-full p-8 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className={cn("p-4 rounded-2xl shrink-0 group-hover:rotate-6 transition-transform", colorClass)}>
                    <Icon size={28} />
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                        isPositive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-rose-50 text-rose-700 border-rose-100"
                    )}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="mt-8 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{value}</h3>
                <p className="mt-2 text-xs font-bold text-slate-500">{subtitle}</p>
            </div>
        </Card>
    );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export default function Analytics() {
    const [summary, setSummary] = useState(null);
    const [enhanced, setEnhanced] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sum, enh] = await Promise.all([
                reportService.getFinancialSummary(),
                reportService.getEnhancedAnalytics()
            ]);
            setSummary(sum);
            setEnhanced(enh);
        } catch (err) {
            setError(err.message ?? 'Failed to load business intelligence data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAnalytics(); }, []);

    return (
        <MainLayout title="Financial Intelligence">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
                    <p className="text-sm text-slate-500 font-medium">Visualizing your business growth and financial health.</p>
                </div>
                <Button variant="outline" className="gap-2 rounded-xl shadow-sm bg-white border-slate-200" onClick={loadAnalytics} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    Update Data
                </Button>
            </div>

            {error && <Alert variant="error" message={error} className="mb-8 shadow-lg" onClose={() => setError(null)} />}

            {loading ? (
                <div className="flex h-96 items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw size={48} className="animate-spin text-blue-500 opacity-20" />
                        <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Crunching numbers...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* ── Top Level Stats ────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <MetricCard
                            title="Total Revenue"
                            value={fmt(summary?.revenue)}
                            subtitle="Current overall income"
                            trend={12.4}
                            icon={TrendingUp}
                            colorClass="icon-box-blue"
                        />
                        <MetricCard
                            title="Net Profit"
                            value={fmt(summary?.netProfit)}
                            subtitle={`${summary?.margin}% Net Margin`}
                            trend={8.2}
                            icon={DollarSign}
                            colorClass={summary?.netProfit >= 0 ? "icon-box-emerald" : "icon-box-rose"}
                        />
                        <MetricCard
                            title="Master Data"
                            value={summary?.breakdown.invoices}
                            subtitle="Total invoices processed"
                            icon={Activity}
                            colorClass="icon-box-amber"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* ── Monthly Sales Chart ──────────────────────────────────── */}
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                                <CardTitle className="text-slate-900 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <BarChart3 size={20} className="text-blue-500" /> Monthly Revenue Trend
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs mt-1 font-bold">Sales growth over the last 6 months.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80 pt-10 pr-6 pb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={enhanced?.monthlyData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                            tickFormatter={(val) => `₹${val/1000}k`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => fmt(val)}
                                        />
                                        <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* ── Expense vs Profit Chart ──────────────────────────────── */}
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                                <CardTitle className="text-slate-900 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <PieChart size={20} className="text-emerald-500" /> Financial Health
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs mt-1 font-bold">Comparison of Expenses vs Net Profit by Month.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80 pt-10 pr-6 pb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={enhanced?.monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                            tickFormatter={(val) => `₹${val/1000}k`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => fmt(val)}
                                        />
                                        <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                                        <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Top Selling Items ──────────────────────────────────────── */}
                    <Card className="enterprise-card overflow-hidden mb-12">
                        <CardHeader className="bg-slate-900 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <Package size={20} className="text-blue-400" /> Top Performing Products
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 text-xs mt-2 uppercase tracking-tight">AI-Ranked performance matrix.</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">Phase 1 Insight</p>
                                    <p className="text-xs font-black text-blue-400 tracking-widest uppercase">Live Tracking</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {enhanced?.topItems.length === 0 ? (
                                <div className="p-20 text-center text-slate-400 opacity-50">
                                    No sales data available to rank items.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {enhanced?.topItems.map((item, i) => (
                                        <div key={i} className="group flex items-center gap-8 p-8 hover:bg-slate-50 transition-all duration-300">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white font-black text-lg group-hover:scale-110 transition-transform">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-bold text-slate-900 text-lg tracking-tight truncate pr-4">{item.name}</span>
                                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{item.quantity} Units</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                            style={{ width: `${(item.quantity / (enhanced.topItems[0].quantity || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-32 text-right">
                                                        <span className="text-sm font-black text-slate-900 tabular-nums">{fmt(item.revenue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
}
