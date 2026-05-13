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
import customerService from '../services/customerService';
import pdfExportService from '../services/pdfExportService';
import MainLayout from '../layouts/MainLayout';
import ReturnModal from '../components/ReturnModal';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function InvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const fetchInvoice = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await invoiceService.getById(id);
            setInvoice(data);
            if (data.customerId) {
                try {
                    const custData = await customerService.getById(data.customerId);
                    setCustomer(custData);
                } catch (err) {
                    console.error('Failed to load customer details:', err);
                }
            }
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

    const handleThermalPrint = () => {
        document.body.classList.add('thermal-print-mode');
        window.print();
        document.body.classList.remove('thermal-print-mode');
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

    const totalPaid = invoice.paidAmount || invoice.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const change = invoice.changeAmount || (totalPaid - invoice.grandTotal > 0 ? totalPaid - invoice.grandTotal : 0);

    return (
        <MainLayout title="Invoice Detail">
            {/* CSS for Thermal Print */}
            <style>{`
                @media print {
                    .thermal-print-mode .no-print,
                    .thermal-print-mode .invoice-container,
                    .thermal-print-mode header,
                    .thermal-print-mode footer,
                    .thermal-print-mode nav,
                    .thermal-print-mode .sidebar {
                        display: none !important;
                    }
                    .thermal-print-mode .thermal-receipt {
                        display: block !important;
                        width: 80mm;
                        padding: 5mm;
                        background: white;
                        color: black;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.4;
                        margin: 0 auto;
                    }
                    .thermal-print-mode .thermal-receipt hr {
                        border: none;
                        border-top: 1px dashed black;
                        margin: 5px 0;
                    }
                }
                .thermal-receipt {
                    display: none;
                }
            `}</style>

            <div className="max-w-[1000px] mx-auto px-4 py-8">
                
                {/* Action Bar */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <button 
                        onClick={() => navigate('/invoices')} 
                        className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Invoices
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleThermalPrint} className="h-10 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                            <Receipt size={16} /> Thermal Print
                        </button>
                        <button onClick={() => window.print()} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <Printer size={16} /> Print Full Page
                        </button>
                        <button onClick={handleDownload} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <Download size={16} /> Save PDF
                        </button>
                        <button onClick={handleWhatsAppShare} className="h-10 px-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all">
                            <MessageCircle size={16} /> WhatsApp
                        </button>
                        <button onClick={() => setIsReturnModalOpen(true)} className="h-10 px-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/50 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all">
                            <RotateCcw size={16} /> Return
                        </button>
                    </div>
                </div>

                {/* Invoice Container (A4 / Screen View) */}
                <div className="invoice-container bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-100/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    
                    {/* Top Accent Bar */}
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    {/* Header */}
                    <div className="p-8 sm:p-12 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Receipt size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                            {localStorage.getItem('tenantName') || 'BIZFLOW'}
                                        </h1>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Tax Invoice</p>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Official Receipt</p>
                                    <p>Thank you for your business!</p>
                                </div>
                            </div>

                            <div className="text-left md:text-right space-y-4">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
                                    <CheckCircle2 size={10} className="mr-1" /> {invoice.paymentStatus || 'PAID'}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Invoice Number</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">#{invoice.invoiceNumber || invoice.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-12 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <User size={10} /> Billed To
                                </p>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">
                                    {invoice.customerName || invoice.customer?.name || 'Walk-in Customer'}
                                </h3>
                                {customer && (
                                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 font-medium">
                                        {customer.address && <p>{customer.address}</p>}
                                        {(customer.city || customer.state) && (
                                            <p>{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state} {customer.pincode}</p>
                                        )}
                                        {customer.gstin && <p className="font-bold text-slate-700 dark:text-slate-300">GSTIN: {customer.gstin}</p>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
                                {invoice.customerPhone && (
                                    <p className="flex items-center gap-1.5">
                                        <Phone size={12} className="text-slate-400" /> {invoice.customerPhone}
                                    </p>
                                )}
                                {customer?.email && (
                                    <p className="flex items-center gap-1.5">
                                        <Mail size={12} className="text-slate-400" /> {customer.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={10} /> Issue Date
                                </p>
                                <p className="font-black text-slate-800 dark:text-white">
                                    {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN', { 
                                        day: '2-digit', month: 'short', year: 'numeric' 
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <CreditCard size={10} /> Payment Mode
                                </p>
                                <p className="font-black text-slate-800 dark:text-white">
                                    {invoice.payments?.map(p => p.paymentModeName).join(', ') || 'CASH'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-8 sm:p-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="pb-4">Item Detail</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-right">Unit Price</th>
                                        <th className="pb-4 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invoice.items?.map((item, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-5">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{item.itemName || 'Product'}</p>
                                                <div className="flex flex-wrap gap-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                    <span>SKU: {item.sku || 'N/A'}</span>
                                                    {item.taxRuleName && <span>| Tax: {item.taxRuleName} ({item.taxRate}%)</span>}
                                                    {item.discountPct > 0 && <span>| Disc: {item.discountPct}%</span>}
                                                </div>
                                            </td>
                                            <td className="py-5 text-center text-sm font-bold text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                            <td className="py-5 text-right text-sm font-bold text-slate-600 dark:text-slate-300">{fmt(item.unitPrice)}</td>
                                            <td className="py-5 text-right text-sm font-black text-slate-900 dark:text-white">{fmt(item.lineTotal || (item.quantity * item.unitPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-8 flex flex-col md:flex-row justify-between gap-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                            <div className="max-w-[400px]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Internal Note</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                    {invoice.notes || "No special instructions provided for this transaction."}
                                </p>
                            </div>

                            <div className="w-full md:w-80 space-y-3">
                                <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 dark:text-white">{fmt(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-indigo-600">
                                        <span>Tax Amount</span>
                                        <span>+{fmt(invoice.taxAmount)}</span>
                                    </div>
                                    {invoice.discountAmount > 0 && (
                                        <div className="flex justify-between text-rose-500">
                                            <span>Discount</span>
                                            <span>-{fmt(invoice.discountAmount)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Payable</span>
                                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{fmt(invoice.grandTotal)}</span>
                                </div>
                                
                                <div className="space-y-1 pt-2 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                        <span>Paid Amount</span>
                                        <span className="text-slate-800 dark:text-white">{fmt(totalPaid)}</span>
                                    </div>
                                    {change > 0 && (
                                        <div className="flex justify-between text-xs font-bold text-emerald-600">
                                            <span>Change Returned</span>
                                            <span>{fmt(change)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Final Total</span>
                                        <span className="text-lg font-black">{fmt(invoice.grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 text-center no-print">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authorized Digital Document</p>
                    </div>
                </div>

                {/* Thermal Receipt View (Hidden on screen, visible only during thermal print) */}
                <div className="thermal-receipt">
                    <div className="text-center font-bold text-lg uppercase">{localStorage.getItem('tenantName') || 'BIZFLOW'}</div>
                    <div className="text-center text-xs">TAX INVOICE</div>
                    <hr />
                    <div className="text-xs">
                        <p>Inv No  : {invoice.invoiceNumber || invoice.id}</p>
                        <p>Date    : {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
                        <p>Cust    : {invoice.customerName || 'Walk-in Customer'}</p>
                        {invoice.customerPhone && <p>Phone   : {invoice.customerPhone}</p>}
                    </div>
                    <hr />
                    <div className="text-xs">
                        <div className="flex justify-between font-bold">
                            <span className="w-1/2">Item</span>
                            <span className="w-1/4 text-center">Qty</span>
                            <span className="w-1/4 text-right">Amt</span>
                        </div>
                        <hr />
                        {invoice.items?.map((item, i) => (
                            <div key={i} className="mb-1">
                                <p className="font-bold">{item.itemName}</p>
                                <div className="flex justify-between text-[10px]">
                                    <span className="w-1/2">{fmt(item.unitPrice)}</span>
                                    <span className="w-1/4 text-center">x{item.quantity}</span>
                                    <span className="w-1/4 text-right">{fmt(item.lineTotal || (item.quantity * item.unitPrice))}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                            <span>Sub Total:</span>
                            <span>{fmt(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax Amount:</span>
                            <span>+{fmt(invoice.taxAmount)}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{fmt(invoice.discountAmount)}</span>
                            </div>
                        )}
                        <hr />
                        <div className="flex justify-between font-bold text-sm">
                            <span>GRAND TOTAL:</span>
                            <span>{fmt(invoice.grandTotal)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span>{fmt(totalPaid)}</span>
                        </div>
                        {change > 0 && (
                            <div className="flex justify-between font-bold">
                                <span>Change:</span>
                                <span>{fmt(change)}</span>
                            </div>
                        )}
                    </div>
                    <hr />
                    <div className="text-center text-xs mt-4">
                        <p>Thank You! Visit Again.</p>
                        <p className="text-[10px] text-slate-500">Powered by BizFlow</p>
                    </div>
                </div>

            </div>
            
            <ReturnModal 
                isOpen={isReturnModalOpen} 
                onClose={() => setIsReturnModalOpen(false)} 
                onSuccess={() => navigate('/returns')} 
                invoice={invoice} 
            />
        </MainLayout>
    );
}
