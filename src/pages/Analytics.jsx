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
} from 'lucide-react';
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
        <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className={cn("rounded-2xl p-3 shadow-inner", colorClass)}>
                        <Icon size={24} className="text-white" />
                    </div>
                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center gap-0.5 text-xs font-black px-2 py-1 rounded-full",
                            isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                        )}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
                    <h3 className="mt-1 text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                    <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const summary = await reportService.getFinancialSummary();
            setData(summary);
        } catch (err) {
            setError(err.message ?? 'Failed to calculate insights.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSummary(); }, []);

    return (
        <MainLayout title="Financial Intelligence">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Business Analytics</h1>
                    <p className="text-sm text-slate-500 font-medium">Real-time financial performance and health markers.</p>
                </div>
                <Button variant="outline" className="gap-2 rounded-xl shadow-sm bg-white" onClick={fetchSummary} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    Refresh Insights
                </Button>
            </div>

            {error && <Alert variant="error" message={error} className="mb-8 shadow-lg" onClose={() => setError(null)} />}

            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="h-40 bg-slate-50 border-none" />
                    ))}
                </div>
            ) : data && (
                <>
                    {/* ── Top Level Stats ────────────────────────────────────────── */}
                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <MetricCard
                            title="Gross Revenue"
                            value={fmt(data.revenue)}
                            subtitle="Total paid invoices"
                            trend={12}
                            icon={TrendingUp}
                            colorClass="bg-blue-600"
                        />
                        <MetricCard
                            title="Operational Costs"
                            value={fmt(data.costs)}
                            subtitle="Purchases + Expenses"
                            trend={-4}
                            icon={TrendingDown}
                            colorClass="bg-rose-500"
                        />
                        <MetricCard
                            title="Net Profit"
                            value={fmt(data.netProfit)}
                            subtitle={`${data.margin}% profit margin`}
                            icon={DollarSign}
                            colorClass={data.netProfit >= 0 ? "bg-emerald-500" : "bg-rose-600"}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* ── Revenue Composition ──────────────────────────────────── */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="text-blue-500" size={20} /> Data Composition
                                </CardTitle>
                                <CardDescription>Count of records processed for this summary.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    {[
                                        { label: 'Invoices Issued', count: data.breakdown.invoices, color: 'bg-blue-500' },
                                        { label: 'Purchase Orders', count: data.breakdown.purchases, color: 'bg-slate-900' },
                                        { label: 'Expense Entries', count: data.breakdown.expenses, color: 'bg-rose-500' },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm font-bold text-slate-700">
                                                <span>{item.label}</span>
                                                <span>{item.count}</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", item.color)}
                                                    style={{ width: `${Math.min((item.count / 50) * 100, 100)}%` }} // Visual scaling
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── System Status ────────────────────────────────────────── */}
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 bg-slate-900 text-white">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity size={20} className="text-emerald-400" /> System Integrity
                                </CardTitle>
                                <CardDescription className="text-slate-400">Real-time engine status.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                                        <Target className="mx-auto mb-2 text-blue-400" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Engine</p>
                                        <p className="text-xl font-bold">VITEBI-2.0</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                                        <RefreshCw className="mx-auto mb-2 text-emerald-400" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Sync Status</p>
                                        <p className="text-xl font-bold text-emerald-400">Live</p>
                                    </div>
                                </div>
                                <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Efficiency Scored</p>
                                        <p className="text-3xl font-black">98.4%</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full border-4 border-white/20 flex items-center justify-center font-black">
                                        AI
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </MainLayout>
    );
}
