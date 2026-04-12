import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Receipt, 
    ArrowLeft, 
    Download, 
    Printer, 
    CreditCard, 
    Loader2, 
    RotateCcw
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import pdfExportService from '../services/pdfExportService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn } from '../utils/cn';
import { formatCurrency as fmt } from '../utils/formatCurrency';
import ReturnModal from '../components/ReturnModal';

export default function InvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const fetchInvoice = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await invoiceService.getById(id);
            setInvoice(data);
        } catch (err) {
            setError(err.message ?? 'Failed to load invoice details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

    const handleDownload = () => {
        if (invoice) pdfExportService.generateInvoicePDF(invoice);
    };

    if (loading) {
        return (
            <MainLayout title="Loading Invoice...">
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Retrieving Ledger...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !invoice) {
        return (
            <MainLayout title="Error">
                <Alert variant="error" message={error || 'Invoice not found'} className="mx-auto max-w-2xl" />
                <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => navigate('/invoices')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={`Invoice ${invoice.invoiceNumber || id}`}>
            {/* Header Actions */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="gap-2 dark:text-slate-400">
                    <ArrowLeft className="h-4 w-4" /> Back to List
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 dark:border-slate-800 dark:text-slate-300" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 dark:border-slate-800 dark:text-slate-300" onClick={handleDownload}>
                        <Download className="h-4 w-4" /> PDF Report
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-rose-500 hover:bg-rose-50 border-rose-100" onClick={() => setIsReturnModalOpen(true)}>
                        <RotateCcw className="h-4 w-4" /> Process Return
                    </Button>
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <CreditCard className="h-4 w-4" /> Add Payment
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-8 print:max-w-none print:p-0">
                {/* Main Invoice Card */}
                <Card className="overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
                    <CardContent className="p-0">
                        {/* Branded Header */}
                        <div className="bg-slate-900 dark:bg-black p-12 text-white flex flex-col sm:flex-row justify-between items-start gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/30">
                                    <Receipt className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                                        {localStorage.getItem('tenantName') || 'BIZFLOW'}
                                    </h1>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80 font-mono">
                                        Verified Business Operator
                                    </p>
                                </div>
                            </div>
                            <div className="text-right sm:text-right space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-blue-500">Business Invoice</h2>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document No.</p>
                                    <p className="font-mono text-xl font-bold tracking-tight">#INV-{invoice.id || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-12">
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-16 border-b border-slate-100 dark:border-slate-800 pb-12">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight mb-2">
                                            {invoice.customerName || invoice.customer?.name || 'Walk-in Customer'}
                                        </h3>
                                        <div className="space-y-0.5 text-sm font-medium text-slate-500">
                                            {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
                                            {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Issue Date</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                                            {new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString(undefined, { 
                                                day: '2-digit', month: 'short', year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                                            invoice.status === 'PAID' 
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                                                : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                        )}>
                                            {invoice.status || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="mb-16">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-transparent hover:bg-transparent border-b-2 border-slate-900 dark:border-slate-700">
                                            <TableHead className="text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Description</TableHead>
                                            <TableHead className="text-center text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Qty</TableHead>
                                            <TableHead className="text-right text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Unit Price</TableHead>
                                            <TableHead className="text-right text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.items?.map((item, i) => (
                                            <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                <TableCell className="py-6">
                                                    <p className="font-bold text-slate-900 dark:text-slate-200">{item.itemName || 'Product'}</p>
                                                    {item.sku && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">SKU: {item.sku}</p>}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-600 dark:text-slate-400">{item.quantity}</TableCell>
                                                <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">{fmt(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right font-black text-slate-900 dark:text-white">{fmt(item.quantity * item.unitPrice)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end pt-12 border-t border-slate-100 dark:border-slate-800">
                                <div className="w-full sm:w-80 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Grand Total</span>
                                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{fmt(invoice.totalAmount)}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Balance Due</span>
                                            <span className="font-black text-blue-900 dark:text-blue-200">{invoice.status === 'PAID' ? fmt(0) : fmt(invoice.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center py-12 px-8 space-y-4 opacity-30 group hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Authorized Digital Document</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        This document is electronically generated by BizFlow SaaS. No signature is required. For verification, please scan the system logs.
                    </p>
                </div>
            </div>

            <ReturnModal 
                isOpen={isReturnModalOpen} 
                onClose={() => setIsReturnModalOpen(false)} 
                onSuccess={fetchInvoice} 
                invoice={invoice} 
            />
        </MainLayout>
    );
}
