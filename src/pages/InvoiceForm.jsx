import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

/**
 * QuickAddCustomerModal - Now with Address field
 */
function QuickAddCustomerModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

    if (!isOpen) return null;

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name || !form.phone) return setError('Name and Phone are mandatory.');
        setLoading(true);
        setError(null);
        try {
            const result = await customerService.create(form);
            onSuccess(result);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save customer.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Quick Register Customer</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg">{error}</div>}
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold" placeholder="Customer Name" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number *</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold" placeholder="10-digit Mobile" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shipping Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-300" size={14} />
                            <textarea rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full pl-9 pr-4 pt-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm font-semibold resize-none" placeholder="Enter full address" />
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <>Complete Registration & Select</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function InvoiceForm() {
    const navigate = useNavigate();
    const barcodeRef = useRef(null);
    const itemSearchRef = useRef(null);

    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [itemSearch, setItemSearch] = useState('');
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
        discountAmount: 0,
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
                    stock: product.availableQty || 0
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
        
        // ── Validations ──
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
            setError(err.message || 'Transaction Posting Failed.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    return (
        <MainLayout title="Terminal">
            <QuickAddCustomerModal 
                isOpen={isQuickAddOpen} 
                onClose={() => setIsQuickAddOpen(false)} 
                onSuccess={(c) => { setCustomers(p => [c, ...p]); selectCustomer(c); }} 
            />
            
            <div className="h-[calc(100vh-64px)] bg-slate-50/50 overflow-hidden">
                <div className="max-w-[1700px] mx-auto h-full px-4 pt-4 flex flex-col">

                    {/* ── Compact Header ── */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-bold text-slate-800 tracking-tight">POS Terminal</h1>
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                <Database size={10} /> Active Inventory
                            </div>
                        </div>
                        {error && (
                            <div className="px-4 py-1.5 bg-rose-50 border border-rose-100 rounded text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 flex gap-4 min-h-0 pb-4">
                        
                        {/* ── LEFT COLUMN ── */}
                        <div className="flex-[8] flex flex-col gap-4 min-w-0">
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div id="item-search-box" className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            ref={itemSearchRef}
                                            type="text"
                                            placeholder="Quick Product Search..."
                                            value={itemSearch}
                                            onChange={(e) => { setItemSearch(e.target.value); setShowItemDropdown(true); }}
                                            onFocus={() => setShowItemDropdown(true)}
                                            className="w-full h-10 pl-10 pr-4 rounded border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm font-semibold transition-all shadow-inner"
                                        />
                                        {showItemDropdown && (
                                            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                                                {filteredInventory.map(p => (
                                                    <button key={p.itemId} type="button" onClick={() => addItemToCart(p)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b last:border-0 group">
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-slate-900">{p.itemName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.sku}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Stock: {p.availableQty}</span>
                                                            <span className="text-sm font-bold text-indigo-600">{fmt(p.sellingPrice)}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input type="text" placeholder="Barcode Entry..." value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan(e)} className="w-full h-10 pl-10 pr-4 rounded border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm transition-all shadow-inner" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col min-h-0">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight">
                                        <ShoppingCart size={16} className="text-slate-400" /> Billing Items
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 bg-white shadow-sm z-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3">Item Detail</th>
                                                <th className="px-4 py-3 text-center">Stock</th>
                                                <th className="px-4 py-3">Price</th>
                                                <th className="px-4 py-3">Subtotal</th>
                                                <th className="px-4 py-3 text-center">Quantity</th>
                                                <th className="px-4 py-3 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {form.items.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-slate-800 leading-tight truncate max-w-[200px]">{item.itemName}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{item.sku}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold", item.stock < 10 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500')}>
                                                            {item.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-600 tabular-nums">{fmt(item.unitPrice)}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">{fmt(item.subtotal)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button type="button" onClick={() => updateItemField(index, 'quantity', Math.max(1, Number(item.quantity) - 1))} className="h-6 w-6 border border-slate-200 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600"><Minus size={12} /></button>
                                                            <input type="number" value={item.quantity} onChange={(e) => updateItemField(index, 'quantity', e.target.value)} className="w-8 text-center font-bold text-xs bg-transparent outline-none" />
                                                            <button type="button" onClick={() => updateItemField(index, 'quantity', Number(item.quantity) + 1)} className="h-6 w-6 border border-slate-200 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600"><Plus size={12} /></button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center"><button type="button" onClick={() => removeItem(index)} className="text-slate-200 hover:text-rose-500"><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                            {form.items.length === 0 && (
                                                <tr><td colSpan="6" className="px-4 py-20 text-center text-slate-300 font-bold uppercase text-[9px] tracking-widest">Cart is empty</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="flex-[4] flex flex-col gap-4 min-w-[350px]">
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-tight"><Users size={16} className="text-indigo-600" /> Customer</div>
                                    <button type="button" onClick={() => setIsQuickAddOpen(true)} className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-all"><Plus size={12} /> QUICK ADD</button>
                                </div>
                                <div id="customer-search-box" className="space-y-2 relative">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="text" placeholder={form.customerName} value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} className="w-full h-9 pl-9 pr-3 rounded border border-slate-200 bg-slate-50 outline-none text-xs font-bold text-slate-700 focus:bg-white" />
                                        {showCustomerDropdown && (
                                            <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-200 z-[100] overflow-hidden">
                                                <button type="button" onClick={() => selectCustomer('walk-in')} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 flex items-center gap-2"><Users size={12} className="text-indigo-600" /><span className="text-xs font-bold">Walk-in Customer</span></button>
                                                {filteredCustomers.map(c => (
                                                    <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"><p className="text-xs font-bold">{c.name}</p><p className="text-[9px] text-slate-400">{c.phone}</p></button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {form.customerPhone && (
                                        <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Phone size={10} className="text-indigo-500" /> {form.customerPhone}</div>
                                            {form.customerAddress && <div className="flex items-start gap-2 text-[10px] font-bold text-slate-500"><MapPin size={10} className="text-indigo-500 mt-0.5 shrink-0" /> <span className="leading-relaxed">{form.customerAddress}</span></div>}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                                    <input type="date" value={form.invoiceDate} onChange={(e) => setForm(p => ({ ...p, invoiceDate: e.target.value }))} className="w-full h-9 px-3 rounded border border-slate-200 bg-slate-50 outline-none text-xs font-bold text-slate-700" />
                                </div>
                            </div>

                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col gap-4 min-h-0 overflow-visible">
                                <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase"><span>Subtotal</span><span className="text-slate-800 tabular-nums">{fmt(totals.subtotal)}</span></div>
                                    <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase"><span>Tax (GST)</span><span className="text-indigo-600 tabular-nums">+{fmt(totals.taxAmount)}</span></div>
                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Discount</span><div className="flex items-center bg-white border border-slate-200 rounded px-2 py-0.5"><span className="text-[9px] text-slate-300 mr-1">₹</span><input type="number" value={form.discountAmount} onChange={(e) => setForm(p => ({ ...p, discountAmount: e.target.value }))} className="w-16 text-right font-bold text-xs outline-none" /></div></div>
                                    <div className="pt-2 flex justify-between items-center border-t border-slate-200"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Amount Payable</span><span className="text-2xl font-black text-slate-900 tabular-nums">{fmt(totals.grandTotal)}</span></div>
                                </div>

                                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-2">
                                    <div className="flex items-center justify-between"><label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment</label><button type="button" onClick={() => setForm(p => ({ ...p, splitPayments: p.splitPayments.length > 0 ? [] : paymentModes.map(m => ({ paymentModeId: m.id, name: m.name, amount: 0 })) }))} className="text-[9px] font-bold text-indigo-600 underline">Split Mode</button></div>
                                    {form.splitPayments.length === 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {paymentModes.map(mode => (
                                                <button key={mode.id} type="button" onClick={() => setForm(p => ({ ...p, selectedPaymentModeId: mode.id }))} className={cn("px-3 py-3 rounded border text-[10px] font-bold uppercase transition-all", form.selectedPaymentModeId === mode.id ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-indigo-100")}>{mode.name}</button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {form.splitPayments.map((sp, idx) => (
                                                <div key={sp.paymentModeId} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-100 text-[10px] font-bold"><span className="text-slate-400 uppercase">{sp.name}</span><input type="number" value={sp.amount} onChange={(e) => setForm(p => ({ ...p, splitPayments: p.splitPayments.map((s, i) => i === idx ? { ...s, amount: Number(e.target.value) } : s) }))} className="w-20 text-right bg-transparent outline-none" /></div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button disabled={submitting || form.items.length === 0} type="submit" className={cn("w-full h-14 rounded-lg flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest transition-all", submitting || form.items.length === 0 ? "bg-slate-100 text-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20")}>
                                    {submitting ? <Loader2 className="animate-spin" /> : <>Finalize Sale <CheckCircle2 size={18} /></>}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </MainLayout>
    );
}