import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, X, Users, Loader2, Barcode,
    CreditCard, Layers,
    ArrowLeft, CheckCircle2, Search, Trash2,
    AlertCircle, Minus, ShoppingCart, Info,
    Receipt, Tag, Calendar
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import customerService from '../services/customerService';
import inventoryService from '../services/inventoryService';
import paymentModeService from '../services/paymentModeService';
import MainLayout from '../layouts/MainLayout';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * InvoiceForm – Optimized Compact POS
 * Refined version focused on efficiency, readability, and speed.
 */
export default function InvoiceForm() {
    const navigate = useNavigate();
    const barcodeRef = useRef(null);
    const itemSearchRef = useRef(null);

    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Item search
    const [itemSearch, setItemSearch] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    // Customer search
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const [barcode, setBarcode] = useState('');
    const [paymentModes, setPaymentModes] = useState([]);

    const [form, setForm] = useState({
        customerId: '',
        customerName: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [],
        discountAmount: 0,
        selectedPaymentModeId: '',
        splitPayments: [],   // [{paymentModeId, name, amount}] when split mode active
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
                setError('POS Engine: Connection failure. Please check server.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Close dropdowns on outside click
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
        const grandTotal = subtotal + taxAmount - (Number(form.discountAmount) || 0);
        return { subtotal, taxAmount, grandTotal };
    }, [form.items, form.discountAmount]);

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

    // ── Handlers ──────────────────────────────────────────────────
    function selectCustomer(c) {
        setForm(p => ({ ...p, customerId: c.id, customerName: c.name }));
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    }

    function addItemToCart(product) {
        const existing = form.items.findIndex(i => i.itemId == product.itemId);
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
                }]
            }));
        }
        setItemSearch('');
        setShowItemDropdown(false);
        // refocus item search for rapid adding
        setTimeout(() => itemSearchRef.current?.focus(), 50);
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
        if (!form.customerId) return setError('Customer ID required to post ledger.');
        if (form.items.length === 0) return setError('Cart empty. Add items to settle.');
        if (!form.selectedPaymentModeId && form.splitPayments.length === 0)
            return setError('Select a payment mode.');

        if (form.splitPayments.length > 0) {
            const splitTotal = form.splitPayments.reduce((a, s) => a + (Number(s.amount) || 0), 0);
            if (Math.abs(splitTotal - totals.grandTotal) > 0.01)
                return setError(`Split mismatch: Offset is ${fmt(totals.grandTotal - splitTotal)}`);
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                customerId: Number(form.customerId),
                invoiceDate: form.invoiceDate,
                subtotal: totals.subtotal,
                taxAmount: totals.taxAmount,
                discountAmount: Number(form.discountAmount),
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
                    lineTotal: Number(i.subtotal),
                }))
            };
            const result = await invoiceService.create(payload);
            navigate(`/invoices/${result.id}`, { replace: true });
        } catch (err) {
            setError(err.message || 'Synchronization Error. Please verify network.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50/50">
                <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
                </div>
            </div>
        );
    }

    const splitTotal = form.splitPayments.reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const splitVariance = totals.grandTotal - splitTotal;
    const splitBalanced = form.splitPayments.length === 0 || Math.abs(splitVariance) < 0.01;

    return (
        <MainLayout title="POS Terminal">
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/invoices')}
                            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">POS Terminal</h1>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <form onSubmit={handleBarcodeScan} className="relative group">
                            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                ref={barcodeRef}
                                type="text"
                                placeholder="Scan Barcode..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="h-11 w-64 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:font-medium"
                            />
                        </form>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border-none bg-rose-50 px-6 py-4 text-sm text-rose-600 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span className="flex-1 font-bold leading-snug">{error}</span>
                        <button onClick={() => setError(null)} className="text-rose-300 hover:text-rose-500">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* ── Left Stage ── */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Section: Sale Info */}
                            <div className="rounded-[2rem] border-none bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Users size={16} className="text-blue-500" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Account Selection</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div id="customer-search-box" className="relative">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Customer Name</label>
                                        {form.customerId ? (
                                            <div className="flex items-center justify-between h-14 px-5 rounded-2xl border-2 border-blue-500/20 bg-blue-50 transition-all shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                                        <Users size={16} />
                                                    </div>
                                                    <span className="text-base font-black text-blue-700 truncate">{form.customerName}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, customerId: '', customerName: '' }))}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative group">
                                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search customers..."
                                                        value={customerSearch}
                                                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                                        onFocus={() => setShowCustomerDropdown(true)}
                                                        className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-400 transition-all"
                                                    />
                                                </div>
                                                {showCustomerDropdown && (
                                                    <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                                                        {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => selectCustomer(c)}
                                                                className="w-full text-left px-6 py-4 hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0 flex items-center justify-between group"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 group-hover:text-blue-700">{c.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.phone || "No Mobile"}</p>
                                                                </div>
                                                                <ArrowLeft size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 rotate-180 transition-all" />
                                                            </button>
                                                        )) : (
                                                            <div className="py-8 text-center">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Billing Date</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                            <input
                                                type="date"
                                                name="invoiceDate"
                                                value={form.invoiceDate}
                                                onChange={(e) => setForm(p => ({ ...p, invoiceDate: e.target.value }))}
                                                required
                                                className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-400 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Cart Area */}
                            <div className="rounded-[2rem] border-none bg-white overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <ShoppingCart size={16} className="text-slate-400" />
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cart Items</h2>
                                    </div>
                                    {form.items.length > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                            {form.items.length} Items
                                        </span>
                                    )}
                                </div>

                                {/* Smart Item Search */}
                                <div id="item-search-box" className="relative px-8 py-6 bg-slate-50/30 border-b border-slate-50">
                                    <div className="relative group">
                                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" />
                                        <input
                                            ref={itemSearchRef}
                                            type="text"
                                            placeholder="Find product by name or SKU..."
                                            value={itemSearch}
                                            onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                                            onFocus={() => setShowItemDropdown(true)}
                                            className="w-full h-16 rounded-[1.5rem] border-none bg-white pl-16 pr-6 text-lg font-bold text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 placeholder:font-medium"
                                        />
                                    </div>

                                    {showItemDropdown && (
                                        <div className="absolute top-[85%] left-8 right-8 bg-white rounded-[2rem] shadow-2xl z-40 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                                            {filteredInventory.length > 0 ? filteredInventory.map(p => (
                                                <button
                                                    key={p.itemId}
                                                    type="button"
                                                    onClick={() => addItemToCart(p)}
                                                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-blue-600 hover:text-white transition-all border-b border-slate-50 last:border-0 group"
                                                >
                                                    <div className="text-left">
                                                        <p className="text-base font-black tracking-tight">{p.itemName}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {p.sku && <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">SKU: {p.sku}</span>}
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={cn("h-1.5 w-1.5 rounded-full", p.currentStock < 10 ? 'bg-orange-400' : 'bg-emerald-400')} />
                                                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Stock: {p.currentStock}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <p className="text-lg font-black group-hover:text-blue-100">{fmt(p.sellingPrice)}</p>
                                                        <div className="h-10 w-10 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-white/50">
                                                            <Plus size={18} />
                                                        </div>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="py-12 text-center">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching items</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cart List */}
                                <div className="max-h-[500px] overflow-y-auto">
                                    {form.items.length === 0 ? (
                                        <div className="py-24 text-center">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                                                <ShoppingCart size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Scanning Mesh Terminal...</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {form.items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-8 p-8 hover:bg-slate-50/50 transition-colors group animate-in slide-in-from-left-4 duration-300">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-lg font-black text-slate-900 tracking-tighter truncate leading-tight mb-1">{item.itemName}</h4>
                                                        <div className="flex items-center gap-3">
                                                            <Tag size={12} className="text-slate-300" />
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku || "No SKU"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-32">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 ml-1">Unit Rate</p>
                                                        <div className="flex items-center bg-slate-100/50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                                                            <span className="text-[10px] font-bold text-slate-400 mr-1.5">₹</span>
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)}
                                                                className="w-full text-sm font-black text-slate-700 bg-transparent outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="w-36 flex flex-col items-center">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 text-center">Quantity</p>
                                                        <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-transparent group-hover:bg-white group-hover:shadow-sm transition-all">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateItemField(index, 'quantity', Math.max(1, Number(item.quantity) - 1))}
                                                                className="h-9 w-9 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all active:scale-90"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                                                                className="w-10 text-center text-base font-black text-slate-900 bg-transparent outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateItemField(index, 'quantity', Number(item.quantity) + 1)}
                                                                className="h-9 w-9 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:shadow-sm transition-all active:scale-90"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="w-40 text-right">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Line Total</p>
                                                        <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{fmt(item.subtotal)}</p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="h-12 w-12 flex items-center justify-center rounded-2xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Payment Settlement */}
                            <div className="rounded-[2rem] border-none bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-2 mb-8">
                                    <CreditCard size={16} className="text-blue-500" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Settlement Hub</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                                            <button
                                                type="button"
                                                onClick={() => setForm(p => ({
                                                    ...p,
                                                    splitPayments: p.splitPayments.length > 0
                                                        ? []
                                                        : paymentModes.map(m => ({ paymentModeId: m.id, name: m.name, amount: 0 }))
                                                }))}
                                                className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Layers size={12} />
                                                {form.splitPayments.length > 0 ? 'Single Mode' : 'Split Payment'}
                                            </button>
                                        </div>

                                        {form.splitPayments.length === 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {paymentModes.length === 0 ? (
                                                    <p className="col-span-2 text-[10px] text-slate-400 font-bold text-center py-4 uppercase tracking-widest">
                                                        No payment modes configured
                                                    </p>
                                                ) : paymentModes.map((mode) => (
                                                    <button
                                                        key={mode.id}
                                                        type="button"
                                                        onClick={() => setForm(p => ({ ...p, selectedPaymentModeId: mode.id }))}
                                                        className={cn(
                                                            "flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all duration-300",
                                                            form.selectedPaymentModeId === mode.id
                                                                ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                                                : "border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        <CreditCard size={18} />
                                                        <span className="text-xs font-black uppercase tracking-widest truncate">{mode.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-3xl bg-slate-50 p-6 space-y-4 animate-in zoom-in-95">
                                                {form.splitPayments.map((sp, idx) => (
                                                    <div key={sp.paymentModeId} className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <CreditCard size={14} className="text-blue-400" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sp.name}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="text-xs font-bold text-slate-300 mr-2">₹</span>
                                                            <input
                                                                type="number"
                                                                value={sp.amount}
                                                                onChange={(e) => setForm(p => ({
                                                                    ...p,
                                                                    splitPayments: p.splitPayments.map((s, i) =>
                                                                        i === idx ? { ...s, amount: Number(e.target.value) } : s
                                                                    )
                                                                }))}
                                                                className="w-24 text-right text-base font-black text-slate-900 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className={cn(
                                                    "flex justify-between items-center px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                    splitBalanced ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    <span>{splitBalanced ? '✓ Balanced' : 'Deficit / Offset'}</span>
                                                    <span>{splitBalanced ? '0.00' : fmt(splitVariance)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Terminal Memo</label>
                                        <textarea
                                            name="notes"
                                            value={form.notes}
                                            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                                            rows={8}
                                            placeholder="Add private memos for this transaction..."
                                            className="w-full rounded-[2rem] border-none bg-slate-50 p-8 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Right Stage: The Receipt Summary ── */}
                        <div className="lg:col-span-4 sticky top-8">
                            <div className="rounded-[3rem] border-none bg-slate-900 text-white overflow-hidden shadow-2xl relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full"></div>

                                <div className="px-10 py-10 border-b border-white/5 relative z-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-2">
                                            <Receipt size={16} className="text-blue-500" />
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Checkout</h2>
                                        </div>
                                        <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/30">L-ID: 742</span>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center group/row">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subtotal</span>
                                            <span className="text-lg font-black tracking-tight">{fmt(totals.subtotal)}</span>
                                        </div>

                                        <div className="flex justify-between items-center group/row">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tax (GST)</span>
                                                <span className="text-[8px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded-lg border border-white/10">Per Item</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-400">+{fmt(totals.taxAmount)}</span>
                                        </div>

                                        <div className="flex justify-between items-center group/row">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Adjustment</span>
                                            <div className="flex items-center bg-white/5 rounded-xl px-4 py-2 border border-white/10 focus-within:border-blue-500/50 transition-all">
                                                <span className="text-[10px] font-black text-slate-600 mr-2">₹</span>
                                                <input
                                                    type="number"
                                                    value={form.discountAmount}
                                                    onChange={(e) => setForm(p => ({ ...p, discountAmount: e.target.value }))}
                                                    className="w-20 text-right text-sm font-black text-white outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 py-12 relative z-10">
                                    <div className="mb-10 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4">Total Amount</p>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-2xl font-black text-slate-700">₹</span>
                                            <h2 className="text-7xl font-black tracking-tighter tabular-nums leading-none">
                                                {totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                <span className="text-2xl text-blue-600 font-black">.00</span>
                                            </h2>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || form.items.length === 0 || !form.customerId || (!form.selectedPaymentModeId && form.splitPayments.length === 0)}
                                        className={cn(
                                            "w-full h-24 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-base font-black uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 shadow-2xl relative overflow-hidden group",
                                            submitting || form.items.length === 0 || !form.customerId || (!form.selectedPaymentModeId && form.splitPayments.length === 0)
                                                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                                        {submitting ? (
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    Create Invoice <CheckCircle2 size={24} className="group-hover:rotate-12 transition-transform" />
                                                </div>
                                                <span className="text-[9px] font-bold text-blue-200/50 uppercase tracking-[0.4em] opacity-40">Finalize Transaction</span>
                                            </>
                                        )}
                                    </button>

                                    {!submitting && (!form.customerId || form.items.length === 0 || (!form.selectedPaymentModeId && form.splitPayments.length === 0)) && (
                                        <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-600 mt-6 animate-pulse">
                                            {!form.customerId ? 'Account Required' : form.items.length === 0 ? 'Cart Empty' : 'Select Payment Mode'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </MainLayout>
    );
}