import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    RefreshCw,
    PackageOpen,
    ReceiptText,
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import expenseService from '../services/expenseService';
import inventoryService from '../services/inventoryService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn } from '../utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);

/**
 * Sum a numeric field across an array safely
 * @param {Array} items
 * @param {string} field
 */
const sumField = (items, field) =>
    (items ?? []).reduce((acc, item) => acc + (Number(item[field]) || 0), 0);

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Full-page skeleton while data loads */
function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 rounded-xl bg-slate-200" />
                ))}
            </div>
            <div className="h-64 rounded-xl bg-slate-200" />
        </div>
    );
}

/** Error banner with retry button */
function ErrorBanner({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-10 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-rose-500" />
            <h3 className="text-base font-semibold text-rose-800">Failed to load dashboard data</h3>
            <p className="mt-1 text-sm text-rose-600">{message}</p>
            <Button
                variant="danger"
                size="sm"
                className="mt-4 gap-2"
                onClick={onRetry}
            >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
            </Button>
        </div>
    );
}

/** Empty state for the transactions table */
function EmptyTransactions() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <ReceiptText className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No invoices found</p>
            <p className="mt-1 text-xs">Invoices will appear here once your backend returns data.</p>
        </div>
    );
}

/** A single summary stat card */
function StatCard({ title, value, subtitle, icon: Icon, color, isWarning }) {
    const palette = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    };
    const p = palette[color] ?? palette.blue;

    return (
        <Card className={cn(isWarning && 'border-amber-300 ring-1 ring-amber-200')}>
            <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className={cn('rounded-lg p-2', p.bg, p.text)}>
                        <Icon size={20} />
                    </div>
                    {isWarning && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <AlertCircle className="h-3 w-3" /> Action needed
                        </span>
                    )}
                </div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
                {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

/** Status pill badge */
function StatusBadge({ status }) {
    // Normalize case so "PAID", "paid", "Paid" all work
    const upper = (status ?? '').toUpperCase();
    const styles = {
        PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
        OVERDUE: 'bg-rose-50 text-rose-700 border-rose-100',
        PARTIAL: 'bg-blue-50 text-blue-700 border-blue-100',
    };
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                styles[upper] ?? 'bg-slate-50 text-slate-600 border-slate-100'
            )}
        >
            {status ?? '—'}
        </span>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

/**
 * Dashboard page
 *
 * Data sources (real API endpoints from BizFlow docs):
 *   GET /invoices   → sales total + recent transactions table
 *   GET /expenses   → total expenses
 *   GET /inventory  → low-stock count (items where availableQty <= lowStockThreshold)
 */
export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [inventory, setInventory] = useState([]);

    /** Fetch all dashboard data in parallel */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [inv, exp, stock] = await Promise.all([
                invoiceService.getAll(),
                expenseService.getAll(),
                inventoryService.getAll(),
            ]);
            setInvoices(Array.isArray(inv) ? inv : []);
            setExpenses(Array.isArray(exp) ? exp : []);
            setInventory(Array.isArray(stock) ? stock : []);
        } catch (err) {
            setError(err.message ?? 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ─── Derived metrics ────────────────────────────────────────────────────────
    // Invoices: use grandTotal or totalAmount field depending on API response shape
    const totalSales = sumField(invoices, 'grandTotal') || sumField(invoices, 'totalAmount');
    const totalExpenses = sumField(expenses, 'amount');
    const netProfit = totalSales - totalExpenses;

    // Low stock: items where available qty is at or below the threshold
    const lowStockCount = inventory.filter(
        (item) => (item.availableQty ?? 0) <= (item.lowStockThreshold ?? 0)
    ).length;

    // Show the 10 most-recent invoices in the table
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.invoiceDate ?? b.createdAt ?? 0) - new Date(a.invoiceDate ?? a.createdAt ?? 0))
        .slice(0, 10);

    return (
        <MainLayout title="Dashboard">
            {/* ── Page header ─────────────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-500">
                        Welcome back! Here's a live overview of your business.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={fetchAll} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* ── Loading / Error states ──────────────────────────────────────────── */}
            {loading && <LoadingSkeleton />}

            {!loading && error && <ErrorBanner message={error} onRetry={fetchAll} />}

            {/* ── Main content (only show when data loaded successfully) ──────────── */}
            {!loading && !error && (
                <>
                    {/* ── Stat cards ────────────────────────────────────────────────── */}
                    <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Sales"
                            value={fmt(totalSales)}
                            subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
                            icon={TrendingUp}
                            color="blue"
                        />
                        <StatCard
                            title="Total Expenses"
                            value={fmt(totalExpenses)}
                            subtitle={`${expenses.length} record${expenses.length !== 1 ? 's' : ''}`}
                            icon={TrendingDown}
                            color="rose"
                        />
                        <StatCard
                            title="Net Profit"
                            value={fmt(netProfit)}
                            subtitle={netProfit >= 0 ? 'On track' : 'In the red'}
                            icon={netProfit >= 0 ? ArrowUpRight : ArrowDownRight}
                            color={netProfit >= 0 ? 'emerald' : 'rose'}
                        />
                        <StatCard
                            title="Low Stock Items"
                            value={lowStockCount}
                            subtitle={`of ${inventory.length} total items`}
                            icon={PackageOpen}
                            color="amber"
                            isWarning={lowStockCount > 0}
                        />
                    </div>

                    {/* ── Recent Transactions ───────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Invoices</CardTitle>
                                <CardDescription>
                                    Latest {recentInvoices.length} invoice{recentInvoices.length !== 1 ? 's' : ''} from your backend
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentInvoices.length === 0 ? (
                                <EmptyTransactions />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentInvoices.map((inv) => {
                                            // Handle both flat and nested customer shapes
                                            const customerName =
                                                inv.customerName ??
                                                inv.customer?.name ??
                                                inv.customer ??
                                                '—';
                                            const amount =
                                                inv.grandTotal ?? inv.totalAmount ?? inv.total ?? 0;
                                            const date =
                                                inv.invoiceDate ?? inv.createdAt ?? inv.date;
                                            const displayDate = date
                                                ? new Date(date).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })
                                                : '—';

                                            return (
                                                <TableRow key={inv.id ?? inv.invoiceNumber}>
                                                    <TableCell className="font-medium text-slate-900">
                                                        {inv.invoiceNumber ?? inv.id ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">{customerName}</TableCell>
                                                    <TableCell className="font-medium">{fmt(amount)}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={inv.paymentStatus ?? inv.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right text-slate-500">
                                                        {displayDate}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </MainLayout>
    );
}
