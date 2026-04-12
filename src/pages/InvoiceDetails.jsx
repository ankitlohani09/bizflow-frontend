import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Printer,
    CreditCard,
    Calendar,
    User,
    Hash,
    Receipt,
    Loader2,
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * InvoiceDetails – View and manage a single invoice
 *
 * GET /invoices/{id}
 */
export default function InvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return (
            <MainLayout title="Loading Invoice...">
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" /> Download
                    </Button>
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <CreditCard className="h-4 w-4" /> Add Payment
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Main Invoice Card */}
                <Card className="overflow-hidden shadow-xl sm:rounded-2xl">
                    {/* Visual separation bar at top */}
                    <div className="h-2 bg-blue-600" />

                    <CardContent className="p-8 sm:p-12">
                        {/* Summary Header */}
                        <div className="mb-12 flex flex-col justify-between gap-8 border-b border-slate-100 pb-12 sm:flex-row sm:items-start">
                            <div className="space-y-4">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                                        Invoice
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 font-mono text-sm text-slate-500">
                                        <Hash className="h-3.5 w-3.5" />
                                        {invoice.invoiceNumber || id}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Issued</p>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {new Date(invoice.invoiceDate ?? invoice.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                                    <span className={cn(
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                                        invoice.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                    )}>
                                        {invoice.paymentStatus || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bill To Section */}
                        <div className="mb-12">
                            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill To</h3>
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-slate-900">{invoice.customerName || invoice.customer?.name || 'Walk-in Customer'}</p>
                                    {invoice.customer?.email && <p className="text-sm text-slate-500">{invoice.customer.email}</p>}
                                    {invoice.customer?.phone && <p className="text-sm text-slate-500">{invoice.customer.phone}</p>}
                                    {invoice.customer?.address && <p className="text-sm text-slate-500 whitespace-pre-line">{invoice.customer.address}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <Table className="border-t border-slate-100">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-2/5">Item Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(invoice.items || []).map((item, idx) => (
                                        <TableRow key={item.id || idx}>
                                            <TableCell className="font-medium text-slate-900">
                                                {item.itemName || item.productName || 'Line Item'}
                                                {item.description && <p className="mt-0.5 text-xs font-normal text-slate-400">{item.description}</p>}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{fmt(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right font-semibold">{fmt(item.subtotal || (item.quantity * item.unitPrice))}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!invoice.items || invoice.items.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                                No items listed on this invoice
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals Summary */}
                        <div className="flex flex-col items-end gap-3 border-t border-slate-100 pt-8">
                            <div className="flex w-full max-w-xs justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-900">{fmt(invoice.subtotal || (invoice.grandTotal - (invoice.taxAmount ?? 0)))}</span>
                            </div>
                            {invoice.taxAmount > 0 && (
                                <div className="flex w-full max-w-xs justify-between text-sm text-slate-500">
                                    <span>Tax (GST)</span>
                                    <span className="font-medium text-slate-900">{fmt(invoice.taxAmount)}</span>
                                </div>
                            )}
                            <div className="mt-2 flex w-full max-w-xs justify-between border-t border-blue-100 bg-blue-50/50 px-4 py-3 rounded-xl">
                                <span className="text-base font-bold text-blue-900">Total Amount</span>
                                <span className="text-lg font-black text-blue-600">
                                    {fmt(invoice.grandTotal ?? invoice.totalAmount)}
                                </span>
                            </div>
                            {invoice.paidAmount > 0 && (
                                <div className="flex w-full max-w-xs justify-between text-xs font-medium text-emerald-600 px-4">
                                    <span>Amount Paid</span>
                                    <span>- {fmt(invoice.paidAmount)}</span>
                                </div>
                            )}
                            {invoice.dueAmount > 0 && (
                                <div className="flex w-full max-w-xs justify-between text-xs font-bold text-amber-600 px-4">
                                    <span>Balance Due</span>
                                    <span>{fmt(invoice.dueAmount)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Internal Notes Card */}
                {invoice.notes && (
                    <Card className="bg-amber-50/30 border-amber-100">
                        <CardContent className="p-6">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
                                <AlertCircle size={14} /> Notes
                            </h4>
                            <p className="mt-2 text-sm text-amber-900/70 italic">
                                "{invoice.notes}"
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
