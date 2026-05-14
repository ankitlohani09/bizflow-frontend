import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDateOnly } from '../utils/formatDate';
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
import { useTheme } from '../context/ThemeContext';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function InvoiceDetails() {
    const { branding } = useTheme();
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[14px] font-bold uppercase tracking-widest text-slate-400">Fetching Receipt...</p>
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
                    <button onClick={() => navigate('/invoices')} className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-bold text-[14px] uppercase tracking-widest">Back to List</button>
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
                @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
                .font-barcode {
                    font-family: 'Libre Barcode 39', cursive;
                }
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
                        className="flex items-center gap-2 text-slate-600 hover:text-primary font-bold text-[14px] uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Invoices
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleThermalPrint} className="h-10 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-[14px] font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                            <Receipt size={16} /> Thermal Print
                        </button>
                        <button onClick={() => window.print()} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <Printer size={16} /> Print Full Page
                        </button>
                        <button onClick={handleDownload} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <Download size={16} /> Save PDF
                        </button>
                        <button onClick={handleWhatsAppShare} className="h-10 px-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50 rounded-xl text-[14px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all">
                            <MessageCircle size={16} /> WhatsApp
                        </button>
                        <button onClick={() => setIsReturnModalOpen(true)} className="h-10 px-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/50 rounded-xl text-[14px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all">
                            <RotateCcw size={16} /> Return
                        </button>
                    </div>
                </div>

                {/* Invoice Container (A4 / Screen View) */}
                <div className="invoice-container bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative" style={{ borderRadius: '24px' }}>

                    {/* Minimalist Top Accent */}
                    <div className="h-1.5 bg-slate-900 dark:bg-white" />

                    <div className="p-10 sm:p-16 space-y-12">

                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div className="space-y-3">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto" />
                                ) : (
                                    <div className="h-10 w-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xl font-bold rounded-lg">
                                        {branding.brandName?.charAt(0) || 'B'}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {branding.brandName || 'BIZFLOW'}
                                    </h1>
                                    {branding.companyAddress && (
                                        <p className="text-sm text-slate-500 font-medium">{branding.companyAddress}</p>
                                    )}
                                </div>
                            </div>

                            <div className="text-left md:text-right space-y-2">
                                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">INVOICE</h2>
                                <div className="text-sm text-slate-500 font-medium space-y-0.5">
                                    <p><span className="font-bold text-slate-700 dark:text-slate-300">Invoice No:</span> {invoice.invoiceNumber}</p>
                                    <p><span className="font-bold text-slate-700 dark:text-slate-300">Date:</span> {formatDateOnly(invoice.invoiceDate || invoice.createdAt)}</p>
                                    <p><span className="font-bold text-slate-700 dark:text-slate-300">Status:</span> {invoice.paymentStatus || 'PAID'}</p>
                                    <p><span className="font-bold text-slate-700 dark:text-slate-300">Cashier:</span> {invoice.cashierName || invoice.createdBy || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800" />

                        {/* Billing Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{invoice.customerName || 'Walk-in Customer'}</h3>
                                <div className="text-sm text-slate-500 space-y-0.5 mt-1">
                                    {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
                                    {customer?.address && <p>{customer.address}</p>}
                                </div>
                            </div>
                            <div className="md:text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Details</p>
                                <div className="text-sm text-slate-500 space-y-0.5">
                                    <p><span className="font-bold text-slate-700 dark:text-slate-300">Method:</span> {invoice.payments?.map(p => p.paymentModeName).join(', ') || 'CASH'}</p>

                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-3 pr-4">Item</th>
                                        <th className="py-3 px-4 text-center">Qty</th>
                                        <th className="py-3 px-4 text-right">Price</th>
                                        <th className="py-3 pl-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {invoice.items?.map((item, i) => (
                                        <tr key={i} className="text-sm text-slate-700 dark:text-slate-300">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-slate-900 dark:text-white">{item.itemName || 'Product'}</p>
                                                {item.sku && <p className="text-xs text-slate-400 mt-0.5">SKU: {item.sku}</p>}
                                            </td>
                                            <td className="py-4 px-4 text-center font-medium">{item.quantity}</td>
                                            <td className="py-4 px-4 text-right font-medium">{fmt(item.unitPrice)}</td>
                                            <td className="py-4 pl-4 text-right font-bold text-slate-900 dark:text-white">{fmt(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800" />

                        {/* Totals & Notes */}
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="max-w-md">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {invoice.notes || "No special instructions provided for this transaction."}
                                </p>

                                {/* Barcode here looks clean! */}
                                <div className="mt-6 flex flex-col items-start gap-1">
                                    <span className="font-barcode text-5xl text-slate-900 dark:text-white leading-none">
                                        *{invoice.invoiceNumber}*
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan to Search</span>
                                </div>
                            </div>

                            <div className="w-full md:w-80 space-y-3 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span className="font-medium">Subtotal (Excl. Tax)</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{fmt(invoice.subtotal)}</span>
                                </div>
                                {invoice.taxAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-slate-500">
                                            <span className="font-medium">Tax</span>
                                            <span className="font-bold text-slate-900 dark:text-white">+{fmt(invoice.taxAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span className="font-medium">Subtotal (Incl. Tax)</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{fmt(invoice.subtotal + invoice.taxAmount)}</span>
                                        </div>
                                    </>
                                )}
                                {invoice.discountAmount > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span className="font-medium">Discount ({Math.round((invoice.discountAmount / invoice.subtotal) * 100)}%)</span>
                                        <span className="font-bold text-slate-900 dark:text-white">-{fmt(invoice.discountAmount)}</span>
                                    </div>
                                )}
                                {invoice.shippingAmount > 0 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span className="font-medium">Shipping</span>
                                        <span className="font-bold text-slate-900 dark:text-white">+{fmt(invoice.shippingAmount)}</span>
                                    </div>
                                )}

                                {/* Round Off */}
                                {Math.abs(invoice.grandTotal - (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount)) > 0.01 && (
                                    <div className="flex justify-between text-slate-500">
                                        <span className="font-medium">Round Off</span>
                                        <span className={`font-bold ${invoice.grandTotal > (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount) ? "text-emerald-600" : "text-rose-500"}`}>
                                            {invoice.grandTotal > (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount) ? "+" : ""}{fmt(invoice.grandTotal - (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount))}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-lg">
                                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{fmt(invoice.grandTotal)}</span>
                                </div>

                                {/* Paid & Change if different */}
                                {Math.abs(totalPaid - invoice.grandTotal) > 0.01 && (
                                    <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50 space-y-1">
                                        <div className="flex justify-between text-slate-500 text-xs">
                                            <span>Paid Amount</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{fmt(totalPaid)}</span>
                                        </div>
                                        {change > 0 && (
                                            <div className="flex justify-between text-emerald-600 text-xs">
                                                <span>Change Returned</span>
                                                <span className="font-bold">{fmt(change)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center no-print">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Authorized Digital Document</p>
                    </div>

                </div>

                {/* Thermal Receipt View (Hidden on screen, visible only during thermal print) */}
                <div className="thermal-receipt">
                    {branding.logoUrl && (
                        <div className="text-center mb-2">
                            <img 
                                src={branding.logoUrl.startsWith('blob:') || branding.logoUrl.startsWith('data:') || branding.logoUrl.startsWith('http')
                                    ? branding.logoUrl
                                    : `${import.meta.env.VITE_API_URL}${branding.logoUrl.startsWith('/') ? '' : '/'}${branding.logoUrl}`}
                                alt="Logo" 
                                className="h-10 w-auto mx-auto object-contain" 
                            />
                        </div>
                    )}
                    <div className="text-center font-bold text-lg uppercase">{branding.brandName || 'BIZFLOW'}</div>
                    {branding.companyAddress && (
                        <div className="text-center text-xs text-slate-600 mb-1">{branding.companyAddress}</div>
                    )}
                    <div className="text-center text-[14px]">TAX INVOICE</div>
                    <hr />
                    <div className="text-[14px]">
                        <p>Inv No  : {invoice.invoiceNumber || invoice.id}</p>
                        <p>Date    : {formatDateOnly(invoice.invoiceDate || invoice.createdAt)}</p>
                        <p>Cashier : {invoice.cashierName || invoice.createdBy || 'N/A'}</p>
                        <p>Cust    : {invoice.customerName || 'Walk-in Customer'}</p>
                        {invoice.customerPhone && <p>Phone   : {invoice.customerPhone}</p>}
                    </div>
                    <hr />
                    <div className="text-[14px]">
                        <div className="flex justify-between font-bold">
                            <span className="w-1/2">Item</span>
                            <span className="w-1/4 text-center">Qty</span>
                            <span className="w-1/4 text-right">Amt</span>
                        </div>
                        <hr />
                        {invoice.items?.map((item, i) => (
                            <div key={i} className="mb-1">
                                <p className="font-bold">{item.itemName}</p>
                                <div className="flex justify-between text-[14px]">
                                    <span className="w-1/2">{fmt(item.unitPrice)}</span>
                                    <span className="w-1/4 text-center">x{item.quantity}</span>
                                    <span className="w-1/4 text-right">{fmt(item.lineTotal || (item.quantity * item.unitPrice))}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr />
                    <div className="text-[14px] space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal (Excl. Tax):</span>
                            <span>{fmt(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax Amount:</span>
                            <span>+{fmt(invoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Subtotal (Incl. Tax):</span>
                            <span>{fmt(invoice.subtotal + invoice.taxAmount)}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{fmt(invoice.discountAmount)}</span>
                            </div>
                        )}
                        {invoice.shippingAmount > 0 && (
                            <div className="flex justify-between">
                                <span>Shipping:</span>
                                <span>+{fmt(invoice.shippingAmount)}</span>
                            </div>
                        )}
                        {/* Round Off */}
                        {Math.abs(invoice.grandTotal - (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount)) > 0.01 && (
                            <div className="flex justify-between">
                                <span>Round Off:</span>
                                <span>
                                    {invoice.grandTotal > (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount) ? "+" : ""}
                                    {fmt(invoice.grandTotal - (invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.shippingAmount))}
                                </span>
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
                    <div className="text-center my-2 flex flex-col items-center">
                        <span className="font-barcode text-4xl text-black leading-none">
                            *{invoice.invoiceNumber}*
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Scan to Search</span>
                    </div>
                    <hr />
                    <div className="text-center text-[14px] mt-4">
                        <p>Thank You! Visit Again.</p>
                        <p className="text-[14px] text-slate-500">Powered by {branding.brandName || 'BizFlow'}</p>
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
