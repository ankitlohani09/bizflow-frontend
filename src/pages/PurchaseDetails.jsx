import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDateOnly } from '../utils/formatDate';
import { 
    ShoppingCart, 
    ArrowLeft, 
    Printer, 
    Loader2, 
    Calendar, 
    FileText, 
    CheckCircle2, 
    X,
    Building2,
    Phone,
    Mail,
    MapPin
} from 'lucide-react';
import purchaseService from '../services/purchaseService';
import supplierService from '../services/supplierService';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function PurchaseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [purchase, setPurchase] = useState(null);
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPurchase = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await purchaseService.getById(id);
            setPurchase(data);
            if (data.supplierId) {
                try {
                    const supData = await supplierService.getById(data.supplierId);
                    setSupplier(supData);
                } catch (err) {
                    console.error('Failed to load supplier details:', err);
                }
            }
        } catch (err) {
            setError(err.message ?? 'Failed to load purchase details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchPurchase(); }, [fetchPurchase]);

    if (loading) {
        return (
            <MainLayout title="Purchase Details">
                <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-[14px] font-bold uppercase tracking-widest text-slate-400">Fetching Details...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !purchase) {
        return (
            <MainLayout title="Error">
                <div className="max-w-md mx-auto mt-20 text-center">
                    <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <X size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Purchase not found</h2>
                    <p className="text-sm text-slate-500 mt-2">{error || 'The requested document does not exist.'}</p>
                    <button onClick={() => navigate('/purchases')} className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-[14px] uppercase tracking-widest">Back to List</button>
                </div>
            </MainLayout>
        );
    }

    const statusColors = {
        'PAID': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50',
        'UNPAID': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50',
        'PARTIAL': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50'
    };

    return (
        <MainLayout title="Purchase Details">
            <div className="max-w-[1000px] mx-auto px-4 py-8">
                
                {/* Action Bar */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <button 
                        onClick={() => navigate('/purchases')} 
                        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold text-[14px] uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Purchases
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => window.print()} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>

                {/* Purchase Container */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-100/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    
                    {/* Top Accent Bar */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    {/* Header */}
                    <div className="p-8 sm:p-12 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <ShoppingCart size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight uppercase">
                                            Purchase Order
                                        </h1>
                                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Stock Replenishment</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-left md:text-right space-y-4">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[14px] font-semibold uppercase tracking-widest border ${statusColors[purchase.paymentStatus] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                    {purchase.paymentStatus || 'UNKNOWN'}
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Purchase Number</p>
                                    <p className="text-3xl font-semibold text-slate-900 dark:text-white font-mono tracking-tighter">#{purchase.purchaseNumber || purchase.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 sm:p-12 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Building2 size={10} /> Supplier
                                </p>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white uppercase">
                                    {purchase.supplierName || supplier?.name || 'Unknown Supplier'}
                                </h3>
                                {supplier && (
                                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 font-medium">
                                        {supplier.address && <p>{supplier.address}</p>}
                                        {supplier.gstin && <p className="font-bold text-slate-700 dark:text-slate-300">GSTIN: {supplier.gstin}</p>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 text-[14px] text-slate-600 dark:text-slate-400 font-bold">
                                {supplier?.phone && (
                                    <p className="flex items-center gap-1.5">
                                        <Phone size={12} className="text-slate-400" /> {supplier.phone}
                                    </p>
                                )}
                                {supplier?.email && (
                                    <p className="flex items-center gap-1.5">
                                        <Mail size={12} className="text-slate-400" /> {supplier.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[14px]">
                            <div>
                                <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={10} /> Purchase Date
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {formatDateOnly(purchase.purchaseDate || purchase.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-8 sm:p-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 dark:border-slate-700 text-[14px] font-semibold uppercase tracking-widest text-slate-400">
                                        <th className="pb-4">Item Detail</th>
                                        <th className="pb-4 text-center">Qty</th>
                                        <th className="pb-4 text-right">Unit Cost</th>
                                        <th className="pb-4 text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {purchase.items?.map((item, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-5">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{item.itemName || `Product #${item.itemId}`}</p>
                                                <div className="flex flex-wrap gap-x-2 text-[14px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    <span>SKU: {item.sku || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center text-sm font-bold text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                            <td className="py-5 text-right text-sm font-bold text-slate-600 dark:text-slate-300">{fmt(item.unitCost)}</td>
                                            <td className="py-5 text-right text-sm font-semibold text-slate-900 dark:text-white">{fmt(item.lineTotal || (item.quantity * item.unitCost))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-8 flex flex-col md:flex-row justify-between gap-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                            <div className="max-w-[400px]">
                                <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Remarks / Notes</p>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                    {purchase.remarks || "No special instructions provided for this transaction."}
                                </p>
                            </div>

                            <div className="w-full md:w-80 space-y-3">
                                <div className="space-y-2 text-[14px] font-bold text-slate-600 dark:text-slate-400">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 dark:text-white">{fmt(purchase.subtotal)}</span>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                                    <span className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400 tracking-tighter">{fmt(purchase.grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 text-center no-print">
                        <p className="text-[14px] font-semibold uppercase tracking-[0.3em] text-slate-400">Authorized Digital Document</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
