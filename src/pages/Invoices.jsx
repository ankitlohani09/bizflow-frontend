import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateOnly } from '../utils/formatDate';
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
import Pagination from '../components/ui/Pagination';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

function StatusBadge({ status }) {
    const s = (status || '').toUpperCase();
    const styles = {
        PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
        VOID: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
        PARTIAL: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider',
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
        setCurrentPage(1);
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

    // Paginated results
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <MainLayout title="Invoices">
                        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Invoices</h1>
                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Billing Ledger
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchInvoices} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-200 font-bold" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> CSV Export
                    </Button>
                    <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold px-6 rounded-xl"
                        onClick={() => navigate('/invoices/new')}
                    >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6 shadow-lg" onClose={() => setError(null)} />}

            <Card className="enterprise-card overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-slate-900 border-none font-bold">Invoices & Records</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Showing {filteredInvoices.length} transactions in your ledger.
                            </CardDescription>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Order #, Customer..."
                                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-shadow"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                             <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                                {['ALL', 'PAID', 'PENDING'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setCurrentPage(1);
                                        }}
                                        className={cn(
                                            'px-3 py-1 text-[14px] font-semibold uppercase tracking-widest transition-all rounded-lg',
                                            statusFilter === status
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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
                                <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                    <TableHead className="cursor-pointer hover:text-slate-900 text-[14px] font-semibold uppercase tracking-wider text-slate-500 pl-8 py-4" onClick={() => handleSort('id')}>Invoice info</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 text-[14px] font-semibold uppercase tracking-wider text-slate-500" onClick={() => handleSort('customerName')}>Customer</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 text-[14px] font-semibold uppercase tracking-wider text-slate-500" onClick={() => handleSort('invoiceDate')}>Timeline</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 text-[14px] font-semibold uppercase tracking-wider text-slate-500" onClick={() => handleSort('totalAmount')}>Amount</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                                    <TableHead className="text-right pr-8 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {paginatedInvoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="group border-slate-50 dark:border-slate-800">
                                         <TableCell className="font-bold text-slate-900 dark:text-white pl-8 py-6 leading-none">
                                            {invoice.invoiceNumber || `#INV-${invoice.formattedId || invoice.id || 'N/A'}`}
                                        </TableCell>
                                         <TableCell className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tighter text-[14px]">{invoice.customerName || invoice.customer?.name || 'Walk-in'}</TableCell>
                                        <TableCell className="text-slate-400 font-bold text-[14px] uppercase tracking-widest">
                                            {formatDateOnly(invoice.invoiceDate || invoice.createdAt)}
                                        </TableCell>
                                         <TableCell className="font-semibold text-slate-900 dark:text-white text-lg tabular-nums">{fmt(invoice.totalAmount || invoice.grandTotal || 0)}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={invoice.paymentStatus ?? invoice.status} />
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 transition-opacity">
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
                
                {!loading && filteredInvoices.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredInvoices.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>
        </MainLayout>
    );
}
