import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, 
    Plus, 
    RefreshCw, 
    Search, 
    Eye, 
    Download, 
    MoreVertical, 
    FileDown,
    AlertCircle 
} from 'lucide-react';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import pdfExportService from '../services/pdfExportService';
import invoiceService from '../services/invoiceService';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
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

export default function Invoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

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

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExportCSV = () => {
        const data = flattenData(filteredInvoices);
        exportToCSV(data, 'invoices-report');
    };

    const handleDownloadPDF = (inv) => {
        pdfExportService.generateInvoicePDF(inv);
    };

    const sortedInvoices = [...invoices].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredInvoices = sortedInvoices.filter((inv) => {
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Sales Ledger</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your billing, dynamic invoicing, and cash flow.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchInvoices} disabled={loading} className="dark:text-slate-400">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 dark:border-slate-800 dark:text-slate-300 font-bold" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> CSV Export
                    </Button>
                    <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest px-6 rounded-xl"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6 shadow-lg" onClose={() => setError(null)} />}

            <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="dark:text-white text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Invoice Records</CardTitle>
                            <CardDescription className="dark:text-slate-400 font-medium text-lg tracking-tighter text-slate-900 capitalize leading-none">
                                Showing {filteredInvoices.length} transactions across your filters.
                            </CardDescription>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Order #, Customer..."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1">
                                {['ALL', 'PAID', 'PENDING'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={cn(
                                            'px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg',
                                            statusFilter === status
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <div className="min-w-[800px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest pl-8 py-4" onClick={() => handleSort('id')}>Invoice #</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('customerName')}>Customer</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('invoiceDate')}>Timeline</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('totalAmount')}>Amount</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="text-right pr-8 text-[9px] font-black uppercase tracking-widest">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="dark:border-slate-800 dark:hover:bg-slate-800/40 group">
                                        <TableCell className="font-black text-slate-900 dark:text-slate-200 pl-8 py-6 leading-none">
                                            {invoice.invoiceNumber || `#INV-${invoice.id}`}
                                        </TableCell>
                                        <TableCell className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tighter text-xs">{invoice.customerName || invoice.customer?.name || 'Walk-in'}</TableCell>
                                        <TableCell className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="font-black text-blue-600 dark:text-blue-400 text-lg tabular-nums">{fmt(invoice.totalAmount || invoice.grandTotal || 0)}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={invoice.paymentStatus ?? invoice.status} />
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                    title="View Details"
                                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                                >
                                                    <Eye size={16} className="text-slate-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                    title="Download PDF"
                                                    onClick={() => handleDownloadPDF(invoice)}
                                                >
                                                    <Download size={16} className="text-emerald-500/70" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreVertical size={16} className="text-slate-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </MainLayout>
    );
}
