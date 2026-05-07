import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Receipt, 
    ArrowLeft, 
    Download, 
    Printer, 
    CreditCard, 
    Loader2, 
    RotateCcw,
    MessageCircle,
    MapPin,
    Phone,
    Mail,
    Calendar,
    FileText,
    CheckCircle2,
    User,
    X
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import pdfExportService from '../services/pdfExportService';
import MainLayout from '../layouts/MainLayout';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

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

    const handleDownload = () => {
        if (invoice) pdfExportService.generateInvoicePDF(invoice);
    };

    const handleWhatsAppShare = () => {
        if (!invoice) return;
        const customerName = invoice.customerName || invoice.customer?.name || 'Customer';
        const amount = fmt(invoice.grandTotal || invoice.totalAmount || 0);
        const text = `Hello ${customerName}, your Invoice #${invoice.invoiceNumber || invoice.id} for ${amount} is ready. Thank you!`;
        const phone = invoice.customerPhone || invoice.customer?.phone || '';
        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <MainLayout title="Receipt">
                <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fetching Receipt...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !invoice) {
        return (
            <MainLayout title="Error">
                <div className="max-w-md mx-auto mt-20 text-center">
                    <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <X size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Invoice not found</h2>
                    <p className="text-sm text-slate-500 mt-2">{error || 'The requested document does not exist.'}</p>
                    <button onClick={() => navigate('/invoices')} className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest">Back to List</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={`Invoice Detail`}>
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                
                {/* Header Actions */}
                <div className="mb-8 flex items-center justify-between no-print">
                    <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors">
                        <ArrowLeft size={16} /> Back to Invoices
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                            <Printer size={16} /> Print Receipt
                        </button>
                        <button onClick={handleDownload} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
                            <Download size={16} /> Save PDF
                        </button>
                        <button onClick={handleWhatsAppShare} className="h-10 px-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-all">
                            <MessageCircle size={16} /> WhatsApp
                        </button>
                    </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    
                    {/* Branded Section */}
                    <div className="p-10 flex flex-col md:flex-row justify-between items-start gap-10 border-b border-slate-100 bg-slate-50/50">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                                        {localStorage.getItem('tenantName') || 'BIZFLOW'}
                                    </h1>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mt-1">Official Invoice</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right space-y-4">
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                                <CheckCircle2 size={12} className="mr-1.5" /> {invoice.paymentStatus || 'PAID'}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Number</p>
                                <p className="text-xl font-black text-slate-900 font-mono">#{invoice.invoiceNumber || invoice.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <User size={12} /> Billed To
                                    </p>
                                    <h3 className="text-lg font-black text-slate-900 uppercase">
                                        {invoice.customerName || invoice.customer?.name || 'Walk-in Customer'}
                                    </h3>
                                    <div className="mt-3 space-y-2">
                                        {invoice.customerPhone && (
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                                <Phone size={14} className="text-indigo-400" /> {invoice.customerPhone}
                                            </div>
                                        )}
                                        {invoice.customerAddress && (
                                            <div className="flex items-start gap-2 text-sm font-semibold text-slate-500 leading-relaxed max-w-[300px]">
                                                <MapPin size={14} className="text-indigo-400 mt-1 shrink-0" /> {invoice.customerAddress}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Calendar size={12} /> Issue Date
                                    </p>
                                    <p className="text-sm font-black text-slate-800">
                                        {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', { 
                                            day: '2-digit', month: 'long', year: 'numeric' 
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileText size={12} /> Transaction
                                    </p>
                                    <p className="text-sm font-black text-slate-800">SALE / RETAIL</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-12">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-900">
                                        <th className="pb-4">Item Detail</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-right">Unit Price</th>
                                        <th className="pb-4 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items?.map((item, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-6">
                                                <p className="font-bold text-slate-800">{item.itemName || 'Product'}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">SKU: {item.sku || 'N/A'}</p>
                                            </td>
                                            <td className="py-6 text-center font-bold text-slate-600">{item.quantity}</td>
                                            <td className="py-6 text-right font-semibold text-slate-600">{fmt(item.unitPrice)}</td>
                                            <td className="py-6 text-right font-black text-slate-900">{fmt(item.lineTotal || (item.quantity * item.unitPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-10 pt-10 border-t border-slate-100">
                            <div className="max-w-[400px]">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Note</p>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                                    {invoice.notes || "No special instructions provided for this transaction."}
                                </p>
                            </div>
                            <div className="w-full md:w-80 space-y-4">
                                <div className="space-y-2 border-b border-slate-100 pb-4">
                                    <div className="flex justify-between text-sm font-semibold text-slate-500">
                                        <span>Subtotal</span>
                                        <span>{fmt(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold text-indigo-600">
                                        <span>Tax Amount</span>
                                        <span>+{fmt(invoice.taxAmount)}</span>
                                    </div>
                                    {invoice.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm font-semibold text-rose-500">
                                            <span>Discount</span>
                                            <span>-{fmt(invoice.discountAmount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Payable</span>
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{fmt(invoice.grandTotal)}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Payment Received</span>
                                        <span className="text-lg font-black">{fmt(invoice.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-10 bg-slate-50/50 border-t border-slate-100 text-center space-y-3 no-print">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Authorized Digital Document</p>
                        <p className="text-[10px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                            This receipt is electronically generated by BizFlow POS. No signature required. 
                            For support, contact your store administrator.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
