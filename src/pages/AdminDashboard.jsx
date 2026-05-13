import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Building2,
    ShieldCheck,
    ArrowUpRight,
    RefreshCw,
    Activity,
    Plus,
    CreditCard,
    TrendingUp as TrendingIcon
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import tenantService from '../services/tenantService';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, tenantsData] = await Promise.all([
                tenantService.getGlobalStats(),
                tenantService.getAll()
            ]);
            setStats(statsData);
            setTenants(tenantsData.slice(0, 5));
        } catch (error) {
            console.error('Failed to load admin dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <MainLayout>
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Platform Control</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Neural Ecosystem Overview</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={fetchData} disabled={loading} className="rounded-2xl border-slate-200 h-14 w-14 p-0">
                        <RefreshCw className={cn('h-6 w-6', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        className="gap-3 bg-slate-900 hover:bg-black text-white shadow-2xl rounded-2xl px-8 h-14 text-sm font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95"
                        onClick={() => navigate('/tenants')}
                    >
                        <Plus className="h-5 w-5" /> Onboard Business
                    </Button>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-12"
            >
                {/* Global Metrics */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Businesses"
                        value={stats?.totalTenants || 0}
                        icon={Building2}
                        color="bg-blue-600"
                        subtitle={`${stats?.activeTenants || 0} active nodes`}
                    />
                    <MetricCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        color="bg-indigo-600"
                        subtitle="Global staff network"
                    />
                    <MetricCard
                        title="Enterprise Plans"
                        value={stats?.enterpriseTenants || 0}
                        icon={ShieldCheck}
                        color="bg-amber-500"
                        subtitle="Tier 3 premium accounts"
                    />
                    <MetricCard
                        title="Platform Revenue"
                        value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                        icon={CreditCard}
                        color="bg-rose-500"
                        subtitle="Gross financial output"
                    />
                </div>

                <div className="grid gap-10 lg:grid-cols-3">
                    {/* Growth Chart */}
                    <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white border-none p-0 text-xl font-black uppercase tracking-tight">Business Growth</CardTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Tenant onboarding trend analysis</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-600">
                                <TrendingIcon size={24} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.tenantGrowth || []}>
                                        <defs>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#6366f1' }} />
                                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorGrowth)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Distribution */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[3rem] overflow-hidden p-10 relative group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-200">
                            <CreditCard size={180} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Growth Insights</h3>
                                <h2 className="text-2xl font-black tracking-tight mt-2 italic uppercase">Plan Distribution</h2>
                            </div>

                            <div className="space-y-6">
                                <DistributionBar label="Enterprise" count={stats?.enterpriseTenants || 0} total={stats?.totalTenants || 1} color="bg-amber-500" />
                                <DistributionBar label="Pro" count={stats?.proTenants || 0} total={stats?.totalTenants || 1} color="bg-indigo-500" />
                                <DistributionBar label="Trial" count={stats?.trialTenants || 0} total={stats?.totalTenants || 1} color="bg-slate-500" />
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-white/10">
                                <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                    Platform is running on latest enterprise version. Neural core verified.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid gap-10 lg:grid-cols-2">
                    {/* Revenue Growth Chart */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white border-none p-0 text-xl font-black uppercase tracking-tight">Revenue Trends</CardTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly platform financial output</p>
                            </div>
                            <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-600">
                                <TrendingIcon size={24} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.revenueGrowth || []}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} />
                                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#f43f5e' }} formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Signups */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800/50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-900 dark:text-white border-none p-0 text-xl font-black uppercase">Recent Tenants</CardTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Latest businesses joined the ecosystem</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/tenants')}
                                className="text-indigo-600 font-black tracking-widest uppercase text-[10px]"
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-none">
                                            <th className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pl-10 py-6 text-left">Business</th>
                                            <th className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 py-6 text-left">Plan</th>
                                            <th className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 py-6 text-left">Status</th>
                                            <th className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pr-10 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {tenants.map((tenant) => (
                                            <tr key={tenant.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                                                <td className="pl-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 min-w-[2.5rem] w-auto px-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-[10px] uppercase">
                                                            {tenant.code}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase truncate max-w-[150px]">{tenant.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                        tenant.subscriptionPlan === 'ENTERPRISE' ? "bg-amber-500/10 text-amber-600" :
                                                            tenant.subscriptionPlan === 'PRO' ? "bg-indigo-500/10 text-indigo-600" :
                                                                "bg-slate-500/10 text-slate-500"
                                                    )}>
                                                        {tenant.subscriptionPlan || 'TRIAL'}
                                                    </span>
                                                </td>
                                                <td className="py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("h-2 w-2 rounded-full", tenant.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{tenant.isActive ? 'Active' : 'Offline'}</span>
                                                    </div>
                                                </td>
                                                <td className="pr-10 py-6 text-right">
                                                    <button
                                                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                                                        className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"
                                                    >
                                                        <ArrowUpRight size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </MainLayout>
    );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
    return (
        <motion.div variants={item}>
            <Card className="p-10 group hover:border-indigo-500/20 transition-all duration-500 bg-white dark:bg-slate-900 shadow-2xl border-none relative overflow-hidden rounded-[2.5rem]">
                <div className="relative z-10 flex items-center gap-8">
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform duration-500 group-hover:scale-110", color)}>
                        <Icon size={32} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">{title}</p>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">{value}</h3>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mt-2 opacity-60">{subtitle}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function DistributionBar({ label, count, total, color }) {
    const percentage = (count / total) * 100;
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span>{label}</span>
                <span className="text-slate-500 dark:text-slate-400">{count}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)}
                />
            </div>
        </div>
    );
}
