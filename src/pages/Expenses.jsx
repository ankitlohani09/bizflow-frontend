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

    const filteredExpenses = expenses.filter(ex =>
        (ex.categoryName ?? ex.category?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (ex.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (ex.referenceNo ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const totalSpending = filteredExpenses.reduce((acc, ex) => acc + (ex.amount || 0), 0);

    return (
        <MainLayout title="Expenses">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
                    <p className="text-sm text-slate-500">Track and categorize company expenditures.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchExpenses} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button className="gap-2 bg-rose-600 hover:bg-rose-700" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Record Expense
                    </Button>
                </div>
            </div>

            {/* ── Summary Card ───────────────────────────────────────────────── */}
            <Card className="mb-8 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Wallet size={120} />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex items-center gap-2 text-rose-100 text-sm font-bold uppercase tracking-widest mb-2">
                        <ArrowUpCircle size={16} /> Total Outflow
                    </div>
                    <h2 className="text-4xl font-black">{fmt(totalSpending)}</h2>
                    <p className="mt-1 text-rose-200 text-xs font-medium">
                        Based on {filteredExpenses.length} records in current view
                    </p>
                </CardContent>
            </Card>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Main List ───────────────────────────────────────────────────── */}
            <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle>Expense Audit Trail</CardTitle>
                        <CardDescription>View and manage business spending history.</CardDescription>
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search category, desc..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-50 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <Receipt size={48} className="mb-4" />
                            <p className="font-semibold text-lg">No expenses recorded</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 underline-offset-4">
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExpenses.map((ex) => (
                                    <TableRow key={ex.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Tag size={14} />
                                                </div>
                                                <span className="font-bold text-slate-900">{ex.categoryName || ex.category?.name || 'General'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-slate-600 text-sm italic">
                                            {ex.description || '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <Calendar size={14} />
                                                {new Date(ex.expenseDate || ex.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                {ex.paymentMethod || 'CASH'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-black text-rose-600">
                                            {fmt(ex.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setModal({ isOpen: true, data: ex })}
                                                >
                                                    <Edit size={14} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
