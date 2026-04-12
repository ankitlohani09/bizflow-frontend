import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Plus,
    RefreshCw,
    Search,
    Eye,
    Receipt,
    Filter,
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
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
import { cn } from '../utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const s = (status ?? '').toUpperCase();
    const styles = {
        PAID:    'bg-emerald-50 text-emerald-700 border-emerald-100',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
        PARTIAL: 'bg-blue-50 text-blue-700 border-blue-100',
        OVERDUE: 'bg-rose-50 text-rose-700 border-rose-100',
        DRAFT:   'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
            styles[s] ?? 'bg-slate-50 text-slate-500 border-slate-100'
        )}>
            {status || '—'}
        </span>
    );
}

function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-slate-100" />
            ))}
        </div>
    );
}

// ─── Invoices Page ────────────────────────────────────────────────────────────

export default function Invoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await invoiceService.getAll();
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load invoices.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    // ── Client-side filter ────────────────────────────────────────────────────
    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch =
            (inv.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (inv.customerName ?? inv.customer?.name ?? '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' ||
            (inv.paymentStatus ?? inv.status ?? '').toUpperCase() === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <MainLayout title="Invoices">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500">Manage all your sales billing and payments.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={fetchInvoices} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        className="gap-2"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle>Invoice Records</CardTitle>
                        <CardDescription>
                            {filteredInvoices.length} result{filteredInvoices.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search # or Customer..."
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        'px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md',
                                        statusFilter === status
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <TableSkeleton />
                    ) : filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                            <Receipt className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No invoices found</p>
                            <p className="mt-1 text-sm">Create your first invoice to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((inv) => {
                                    const amount = inv.grandTotal ?? inv.totalAmount ?? 0;
                                    const customer = inv.customerName ?? inv.customer?.name ?? '—';
                                    const date = inv.invoiceDate ?? inv.createdAt;

                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-semibold text-slate-900">
                                                {inv.invoiceNumber || `#${inv.id}`}
                                            </TableCell>
                                            <TableCell className="text-slate-600">{customer}</TableCell>
                                            <TableCell className="text-slate-500">
                                                {date ? new Date(date).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="font-medium">{fmt(amount)}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={inv.paymentStatus ?? inv.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => navigate(`/invoices/${inv.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 text-slate-400 hover:text-blue-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
