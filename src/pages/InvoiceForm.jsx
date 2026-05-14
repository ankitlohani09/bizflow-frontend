import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Plus, X, Users, Loader2, Barcode,
    CreditCard, Layers,
    ArrowLeft, CheckCircle2, Search, Trash2,
    AlertCircle, Minus, ShoppingCart, Info,
    Receipt, Tag, Calendar, Wallet, Banknote, Sparkles, Package,
    Smartphone, QrCode, Landmark, Image as ImageIcon, UserPlus, Database, Phone, User, MapPin, Mail
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import customerService from '../services/customerService';
import inventoryService from '../services/inventoryService';
import paymentModeService from '../services/paymentModeService';
import MainLayout from '../layouts/MainLayout';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().optional()
});

function QuickAddCustomerModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: { name: '', phone: '', email: '', address: '' },
        mode: 'onChange'
    });

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const result = await customerService.create(data);
            onSuccess(result);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save customer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-slate-700 dark:text-white uppercase tracking-widest">Register Customer</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-rose-50 text-rose-600 text-[14px] font-bold rounded-lg">{error}</div>}

                    <div className="space-y-1">
                        <label className="text-[15px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                autoFocus
                                {...register('name')}
                                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Customer Name"
                            />
                        </div>
                        {errors.name && <p className="text-rose-500 text-[14px] font-bold mt-0.5 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[15px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Mobile Number *</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="tel"
                                {...register('phone')}
                                maxLength={10}
                                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="10-digit Mobile"
                            />
                        </div>
                        {errors.phone && <p className="text-rose-500 text-[14px] font-bold mt-0.5 ml-1">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[15px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400" size={14} />
                            <textarea
                                rows={2}
                                {...register('address')}
                                className="w-full pl-9 pr-4 pt-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Enter full address"
                            />
                        </div>
                        {errors.address && <p className="text-rose-500 text-[14px] font-bold mt-0.5 ml-1">{errors.address.message}</p>}
                    </div>

                    <button disabled={loading} type="submit" className="w-full h-12 bg-indigo-600 text-white rounded-xl font-semibold uppercase tracking-widest text-[14px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <>Register & Select</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function InvoiceForm() {
    const navigate = useNavigate();
    const itemSearchRef = useRef(null);

    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [itemSearch, setItemSearch] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [paymentModes, setPaymentModes] = useState([]);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    const [form, setForm] = useState({
        customerId: '',
        customerName: 'Walk-in Customer',
        customerPhone: '',
        customerAddress: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [],
        discountPercent: 0,
        shippingAmount: 0,
        selectedPaymentModeId: '',
        splitPayments: [],
        notes: '',
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [custs, items, modes] = await Promise.all([
                    customerService.getAll(),
                    inventoryService.getAll(),
                    paymentModeService.getAll(),
                ]);
                setCustomers(Array.isArray(custs) ? custs : []);
                setInventory(Array.isArray(items) ? items : []);
                const activeModes = Array.isArray(modes) ? modes.filter(m => m.isActive !== false) : [];
                setPaymentModes(activeModes);
                if (activeModes.length > 0) {
                    setForm(p => ({ ...p, selectedPaymentModeId: activeModes[0].id }));
                }
            } catch {
                setError('POS: Service Sync Error.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (!e.target.closest('#item-search-box')) setShowItemDropdown(false);
            if (!e.target.closest('#customer-search-box')) setShowCustomerDropdown(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const totals = useMemo(() => {
        const subtotal = form.items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
        const taxAmount = form.items.reduce((acc, i) => {
            return acc + ((Number(i.subtotal) || 0) * (Number(i.taxRate) || 0)) / 100;
        }, 0);
        const discountAmount = (subtotal * (Number(form.discountPercent) || 0)) / 100;
        const exactTotal = subtotal + taxAmount - discountAmount + (Number(form.shippingAmount) || 0);
        const grandTotal = Math.round(exactTotal);
        const roundOff = grandTotal - exactTotal;
        return { subtotal, taxAmount, discountAmount, grandTotal, roundOff };
    }, [form.items, form.discountPercent, form.shippingAmount]);

    const filteredInventory = useMemo(() => {
        if (!itemSearch.trim()) return inventory.slice(0, 5);
        const term = itemSearch.toLowerCase();
        return inventory.filter(p =>
            p.itemName.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term)
        ).slice(0, 8);
    }, [inventory, itemSearch]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers.slice(0, 4);
        const term = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.phone?.includes(term)
        ).slice(0, 6);
    }, [customers, customerSearch]);

    function selectCustomer(c) {
        if (c === 'walk-in') {
            setForm(p => ({ ...p, customerId: '', customerName: 'Walk-in Customer', customerPhone: '', customerAddress: '' }));
        } else {
            setForm(p => ({ ...p, customerId: c.id, customerName: c.name, customerPhone: c.phone || '', customerAddress: c.address || '' }));
        }
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    }

    function addItemToCart(product) {
        const existing = form.items.findIndex(i => i.itemId == product.itemId && i.batchNo == product.batchNo);
        if (existing > -1) {
            updateItemField(existing, 'quantity', Number(form.items[existing].quantity) + 1);
        } else {
            setForm(p => ({
                ...p,
                items: [...p.items, {
                    itemId: product.itemId,
                    itemName: product.itemName,
                    sku: product.sku,
                    quantity: 1,
                    unitPrice: product.sellingPrice || 0,
                    taxRate: Number(product.taxRate) || 0,
                    taxRuleId: product.taxRuleId || null,
                    subtotal: product.sellingPrice || 0,
                    stock: product.availableQty || 0,
                    batchNo: product.batchNo || null,
                    expiryDate: product.expiryDate || null
                }]
            }));
        }
        setItemSearch('');
        setShowItemDropdown(false);
    }

    function removeItem(index) {
        setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
    }

    function updateItemField(index, field, value) {
        const updated = [...form.items];
        const item = { ...updated[index], [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
            item.subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        }
        updated[index] = item;
        setForm(p => ({ ...p, items: updated }));
    }

    function handleBarcodeScan(e) {
        e.preventDefault();
        const code = barcode.trim();
        if (!code) return;
        const product = inventory.find(p =>
            p.sku === code || p.itemId?.toString() === code || p.id?.toString() === code
        );
        if (product) {
            addItemToCart(product);
            setBarcode('');
        } else {
            setError(`SKU "${code}" not found.`);
            setTimeout(() => setError(null), 3000);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (form.items.length === 0) return setError('Please add items to cart.');

        const invalidQty = form.items.some(i => Number(i.quantity) <= 0);
        if (invalidQty) return setError('Quantity must be greater than 0.');

        if (form.splitPayments.length > 0) {
            const totalPaid = form.splitPayments.reduce((acc, s) => acc + Number(s.amount), 0);
            if (Math.abs(totalPaid - totals.grandTotal) > 0.01) {
                return setError(`Split total mismatch. Paid: ${fmt(totalPaid)}, Due: ${fmt(totals.grandTotal)}`);
            }
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                customerId: form.customerId ? Number(form.customerId) : null,
                invoiceDate: form.invoiceDate,
                subtotal: totals.subtotal,
                taxAmount: totals.taxAmount,
                discountAmount: totals.discountAmount,
                shippingAmount: Number(form.shippingAmount) || 0,
                grandTotal: totals.grandTotal,
                invoiceType: 'SALE',
                paymentStatus: 'PAID',
                notes: form.notes,
                payments: form.splitPayments.length > 0
                    ? form.splitPayments.map(s => ({ paymentModeId: Number(s.paymentModeId), amount: Number(s.amount) }))
                    : [{ paymentModeId: Number(form.selectedPaymentModeId), amount: totals.grandTotal }],
                items: form.items.map(i => ({
                    itemId: Number(i.itemId),
                    quantity: Number(i.quantity),
                    unitPrice: Number(i.unitPrice),
                    taxRate: Number(i.taxRate),
                    taxRuleId: i.taxRuleId ? Number(i.taxRuleId) : null,
                    subtotal: Number(i.subtotal),
                    batchNo: i.batchNo || null,
                    expiryDate: i.expiryDate || null,
                }))
            };
            const result = await invoiceService.create(payload);
            navigate(`/invoices/${result.id}`, { replace: true });
        } catch (err) {
            setError(err.message || 'Transaction Posting Failed.');
        } finally {
            setSubmitting(false);
        }
    }

    const getPaymentIcon = (name) => {
        const n = name.toUpperCase();
        if (n.includes('CASH')) return <Banknote size={16} />;
        if (n.includes('CARD')) return <CreditCard size={16} />;
        if (n.includes('UPI')) return <QrCode size={16} />;
        if (n.includes('WALLET')) return <Wallet size={16} />;
        return <Landmark size={16} />;
    };

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-400">Loading Terminal...</p>
            </div>
        );
    }

    return (
        <MainLayout title="New Sale">
            <QuickAddCustomerModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onSuccess={(c) => { setCustomers(p => [c, ...p]); selectCustomer(c); }}
            />

            <div className="h-[calc(100vh-64px)] bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
                <div className="max-w-[1700px] mx-auto h-full px-4 pt-4 flex flex-col">

                    {/* ── Header Area ── */}
                    {/* ── Elite Header ── */}
                    <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-2">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                <ShoppingCart size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-none">New Sale</h1>
                                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    System Live
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Date & Time:</label>
                                <span className="text-[13px] font-bold text-slate-700 dark:text-white">
                                    {currentTime.toLocaleDateString('en-IN', { timeZone: localStorage.getItem('app_timezone') || 'Asia/Kolkata' })} | {currentTime.toLocaleTimeString('en-IN', { timeZone: localStorage.getItem('app_timezone') || 'Asia/Kolkata' })}
                                </span>
                            </div>
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-[14px] font-bold flex items-center gap-2 shadow-lg shadow-rose-100/50 dark:shadow-none"
                                    >
                                        <AlertCircle size={14} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex gap-4 min-h-0 pb-4">

                        {/* ── LEFT COLUMN (Cart & Search) ── */}
                        <div className="flex-[8] flex flex-col gap-4 min-w-0">

                            {/* Search & Barcode Card */}
                            <div className="enterprise-card p-4" style={{ overflow: 'visible' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div id="item-search-box" className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            ref={itemSearchRef}
                                            type="text"
                                            placeholder="Search by Product Name or SKU..."
                                            value={itemSearch}
                                            onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                                            onFocus={() => setShowItemDropdown(true)}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none text-sm font-semibold transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/10 dark:text-white"
                                        />
                                        <AnimatePresence>
                                            {showItemDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 max-h-60 overflow-y-auto"
                                                >
                                                    {filteredInventory.map(p => (
                                                        <button key={`${p.itemId}-${p.batchNo}`} type="button" onClick={() => addItemToCart(p)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0 group transition-colors">
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{p.itemName}</p>
                                                                <p className="text-[14px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{p.sku}</p>
                                                                {p.batchNo && (
                                                                    <p className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-widest mt-0.5">Batch: {p.batchNo} {p.expiryDate ? `| Exp: ${new Date(p.expiryDate).toLocaleDateString()}` : ''}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest">Stock: {p.availableQty}</span>
                                                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{fmt(p.sellingPrice)}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {filteredInventory.length === 0 && (
                                                        <div className="px-4 py-6 text-center text-[14px] font-semibold text-slate-400 uppercase tracking-widest">No products found</div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="relative">
                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Scan Barcode here..."
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan(e)}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none text-sm transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/10 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cart Table Card */}
                            <div className="flex-1 enterprise-card flex flex-col min-h-0 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-700 dark:text-white uppercase tracking-widest">
                                        <ShoppingCart size={14} className="text-slate-400" /> Current Cart ({form.items.length})
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-[14px] border-collapse">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm z-10 text-slate-400 font-semibold uppercase text-[13px] tracking-wider border-b border-slate-50 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-3">Item Detail</th>
                                                <th className="px-4 py-3 text-center">Stock</th>
                                                <th className="px-4 py-3 text-right">Unit Price</th>
                                                <th className="px-4 py-3 text-right">Subtotal</th>
                                                <th className="px-4 py-3 text-center">Quantity</th>
                                                <th className="px-6 py-3 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            <AnimatePresence>
                                                {form.items.map((item, index) => (
                                                    <motion.tr
                                                        key={`${item.itemId}-${item.batchNo}`}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                                                    >
                                                        <td className="px-6 py-3">
                                                            <p className="font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px]">{item.itemName}</p>
                                                            <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                                                                <span>{item.sku}</span>
                                                                {item.taxRate > 0 && (
                                                                    <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded-full">GST {item.taxRate}%</span>
                                                                )}
                                                                {item.batchNo && (
                                                                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 rounded-full">Batch: {item.batchNo}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={cn("px-2 py-0.5 rounded-full text-[12px] font-semibold uppercase tracking-widest",
                                                                item.stock < 10
                                                                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400'
                                                                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                            )}>
                                                                {item.stock}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300 tabular-nums">{fmt(item.unitPrice)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">{fmt(item.subtotal)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button type="button" onClick={() => updateItemField(index, 'quantity', Math.max(1, Number(item.quantity) - 1))} className="h-6 w-6 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"><Minus size={10} /></button>
                                                                <input type="number" value={item.quantity} onChange={(e) => updateItemField(index, 'quantity', e.target.value)} className="w-8 text-center font-semibold text-[13px] bg-transparent outline-none dark:text-white" />
                                                                <button type="button" onClick={() => updateItemField(index, 'quantity', Number(item.quantity) + 1)} className="h-6 w-6 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"><Plus size={10} /></button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button type="button" onClick={() => removeItem(index)} className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                            {form.items.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-20 text-center text-slate-300 dark:text-slate-600 font-semibold uppercase text-[13px] tracking-widest">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <ShoppingCart size={32} className="opacity-30" />
                                                            Your cart is empty
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN (Customer & Checkout) ── */}
                        <div className="flex-[4] flex flex-col gap-4 min-w-[380px] min-h-0">

                            {/* Customer Section Card */}
                            <div className="enterprise-card p-5 space-y-4 shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-white uppercase tracking-wider"><Users size={14} className="text-indigo-600" /> Customer</div>
                                    <button type="button" onClick={() => setIsQuickAddOpen(true)} className="flex items-center gap-1 text-[12px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all uppercase tracking-wider"><Plus size={12} /> New</button>
                                </div>
                                <div id="customer-search-box" className="space-y-3 relative">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={form.customerName}
                                            value={customerSearch}
                                            onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none text-[13px] font-bold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 transition-all focus:ring-2 focus:ring-indigo-500/10"
                                        />
                                        <AnimatePresence>
                                            {showCustomerDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden"
                                                >
                                                    <button type="button" onClick={() => selectCustomer('walk-in')} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2 group transition-colors">
                                                        <Users size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                                                        <div>
                                                            <span className="text-[13px] font-bold text-slate-800 dark:text-white">Walk-in Customer</span>
                                                            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Default Account</p>
                                                        </div>
                                                    </button>
                                                    {filteredCustomers.map(c => (
                                                        <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors">
                                                            <p className="text-[13px] font-bold text-slate-800 dark:text-white">{c.name}</p>
                                                            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{c.phone}</p>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <AnimatePresence>
                                        {form.customerPhone && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1.5 overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300"><Phone size={10} className="text-indigo-500" /> {form.customerPhone}</div>
                                                {form.customerAddress && (
                                                    <div className="flex items-start gap-2 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                                                        <MapPin size={10} className="text-indigo-500 mt-0.5 shrink-0" />
                                                        <span className="leading-relaxed">{form.customerAddress}</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </div>

                            {/* Checkout Card */}
                            <div className="enterprise-card p-5 flex flex-col gap-4">

                                {/* Totals Summary */}
                                <div className="space-y-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="flex justify-between text-slate-500 font-bold text-[13px] uppercase tracking-wider">
                                        <span>Subtotal (Excl. Tax)</span>
                                        <span className="text-slate-800 dark:text-white tabular-nums text-[14px]">{fmt(totals.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-bold text-[13px] uppercase tracking-wider">
                                        <span>Tax Amount</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums text-[14px]">+{fmt(totals.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-bold text-[13px] uppercase tracking-wider">
                                        <span>Subtotal (Incl. Tax)</span>
                                        <span className="text-slate-800 dark:text-white tabular-nums text-[14px]">{fmt(totals.subtotal + totals.taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-bold text-[13px] uppercase tracking-wider items-center">
                                        <span>Shipping Amount</span>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow">
                                            <span className="text-[12px] font-bold text-slate-300 dark:text-slate-600 mr-1">₹</span>
                                            <input type="number" value={form.shippingAmount} onChange={(e) => setForm(p => ({ ...p, shippingAmount: e.target.value }))} className="w-14 text-right font-bold text-[13px] outline-none bg-transparent dark:text-white" />
                                        </div>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Discount (%)</span>
                                             <span className="text-[11px] font-bold text-slate-400">Amt: {fmt(totals.discountAmount)}</span>
                                        </div>
                                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow">
                                            <input type="number" value={form.discountPercent} onChange={(e) => setForm(p => ({ ...p, discountPercent: e.target.value }))} className="w-14 text-right font-bold text-[13px] outline-none bg-transparent dark:text-white" />
                                            <span className="text-[12px] font-bold text-slate-300 dark:text-slate-600 ml-1">%</span>
                                        </div>
                                    </div>
                                    {Math.abs(totals.roundOff) > 0.001 && (
                                        <div className="flex justify-between text-slate-500 font-bold text-[13px] uppercase tracking-wider">
                                            <span>Round Off</span>
                                            <span className={totals.roundOff > 0 ? "text-emerald-600" : "text-rose-500"}>
                                                {totals.roundOff > 0 ? "+" : ""}{fmt(totals.roundOff)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
                                        <span className="text-[13px] font-bold text-slate-700 dark:text-white uppercase tracking-wider">Grand Total</span>
                                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">{fmt(totals.grandTotal)}</span>
                                    </div>
                                </div>

                                {/* Payment Modes */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
                                        <button type="button" onClick={() => setForm(p => ({ ...p, splitPayments: p.splitPayments.length > 0 ? [] : paymentModes.map(m => ({ paymentModeId: m.id, name: m.name, amount: 0 })) }))} className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline">
                                            {form.splitPayments.length > 0 ? 'Single Mode' : 'Split Pay'}
                                        </button>
                                    </div>

                                    {form.splitPayments.length === 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {paymentModes.map(mode => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, selectedPaymentModeId: mode.id }))}
                                                    className={cn("px-4 py-3 rounded-xl border text-[13px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 justify-center",
                                                        form.selectedPaymentModeId === mode.id
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-slate-600"
                                                    )}
                                                >
                                                    {getPaymentIcon(mode.name)}
                                                    {mode.name}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {form.splitPayments.map((sp, idx) => (
                                                <div key={sp.paymentModeId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-50 dark:border-slate-700 text-[13px] font-bold">
                                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                        {getPaymentIcon(sp.name)}
                                                        {sp.name}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-slate-300 dark:text-slate-600 mr-1">₹</span>
                                                        <input
                                                            type="number"
                                                            value={sp.amount}
                                                            onChange={(e) => setForm(p => ({ ...p, splitPayments: p.splitPayments.map((s, i) => i === idx ? { ...s, amount: Number(e.target.value) } : s) }))}
                                                            className="w-20 text-right bg-transparent outline-none font-bold dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    disabled={submitting || form.items.length === 0}
                                    type="submit"
                                    className={cn("w-full h-14 rounded-xl flex items-center justify-center gap-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                                        submitting || form.items.length === 0
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 hover:scale-[1.02]"
                                    )}
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>Complete Sale <CheckCircle2 size={18} /></>
                                    )}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </MainLayout>
    );
}