import React, { useState, useEffect, useCallback } from 'react';
import {
    Receipt,
    Plus,
    RefreshCw,
    Search,
    Filter,
    ArrowUpCircle,
    Calendar,
    Wallet,
    Tag,
    Edit,
    Trash2,
    FileDown,
    MoreVertical,
    TrendingUp,
} from 'lucide-react';
import expenseService from '../services/expenseService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import ExpenseModal from '../components/ExpenseModal';
import { cn } from '../utils/cn';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatDateOnly } from '../utils/formatDate';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * Expenses Page – Professional expenditure tracking
 */
export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'expenseDate', direction: 'desc' });

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, data: null });

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await expenseService.getAll();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load expenses.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExportCSV = () => {
        const data = flattenData(filteredExpenses);
        exportToCSV(data, 'expenses-audit-report');
    };

    const sortedExpenses = [...expenses].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredExpenses = sortedExpenses.filter(ex =>
        (ex.categoryName ?? ex.category?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (ex.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (ex.referenceNo ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const totalSpending = filteredExpenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);

    return (
        <MainLayout title="Expenses">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Expenses</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track operational costs and categorize business outflows.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchExpenses} disabled={loading} className="dark:text-slate-400">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 dark:border-slate-800 dark:text-slate-300" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> Export Report
                    </Button>
                    <Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> New Entry
                    </Button>
                </div>
            </div>

            {/* ── Summary Hub ────────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-slate-900 dark:bg-black text-white shadow-2xl rounded-3xl overflow-hidden border-none p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={160} />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <span className="text-[14px] font-black uppercase tracking-[0.2em] text-rose-500">Global Burn Rate</span>
                            <h2 className="text-5xl font-black tracking-tighter tabular-nums mt-4">{fmt(totalSpending)}</h2>
                            <p className="mt-2 text-slate-400 text-[14px] font-bold uppercase tracking-widest">
                                Processing {filteredExpenses.length} verified expenditures
                            </p>
                        </div>
                        <div className="mt-8 flex gap-4">
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[14px] font-black uppercase tracking-widest">Live Monitoring</span>
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="space-y-6">
                    <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-[14px] font-black uppercase tracking-widest text-slate-400">Avg. Per Entry</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                                    {fmt(filteredExpenses.length > 0 ? totalSpending / filteredExpenses.length : 0)}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Receipt size={24} />
                            </div>
                            <div>
                                <p className="text-[14px] font-black uppercase tracking-widest text-slate-400">Total Entries</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                                    {filteredExpenses.length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Directory Table ─────────────────────────────────────────────── */}
            <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="dark:text-white tracking-tighter">Expenditure Audit</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                Verified business costs and operational outflows.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Category or Desc..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8"><TableSkeleton rows={6} /></div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <Receipt size={64} className="mb-4" />
                            <p className="font-black text-xl uppercase tracking-widest">No Outflows Found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                    <TableHead className="pl-8 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('categoryName')}>Classification</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('expenseDate')}>Timeline</TableHead>
                                    <TableHead className="text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('amount')}>Impact</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.map((ex) => (
                                    <TableRow key={ex.id} className="group dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
                                                    <Tag size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter leading-none">{ex.categoryName || ex.category?.name || 'GEN_EXPENSE'}</span>
                                                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate max-w-[200px]">{ex.description || 'REF_NOT_STATED'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                                                    <Calendar size={12} className="text-blue-500" /> {formatDateOnly(ex.expenseDate || ex.createdAt)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[14px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    VIA {ex.paymentMethod || 'CASH_DISBURSEMENT'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-6">
                                            <span className="text-lg font-black text-rose-600 tabular-nums">-{fmt(ex.amount)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                    onClick={() => setModal({ isOpen: true, data: ex })}
                                                >
                                                    <Edit size={14} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                >
                                                    <Trash2 size={14} className="text-slate-400 hover:text-rose-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ExpenseModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchExpenses}
                expense={modal.data}
            />
        </MainLayout>
    );
}
