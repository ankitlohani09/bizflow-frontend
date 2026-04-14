import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Trash2,
    Save,
    X,
    Calculator,
    Package,
    Users,
    Loader2,
    Barcode,
    CreditCard,
    Smartphone,
    Banknote,
    Layers,
    ArrowLeft,
    CheckCircle2,
    ShoppingBag
} from 'lucide-react';
import invoiceService from '../services/invoiceService';
import customerService from '../services/customerService';
import inventoryService from '../services/inventoryService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * InvoiceForm – Next-Gen POS Interface
 */
export default function InvoiceForm() {
    const navigate = useNavigate();

    // ── Data states ──────────────────────────────────────────────────────────
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // ── Form State ───────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        customerId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [
            { itemId: '', quantity: 1, unitPrice: 0, subtotal: 0 }
        ],
        taxRate: 18,
        discountAmount: 0,
        paymentMode: 'CASH',
        splitPayments: { cash: 0, card: 0, upi: 0 },
        notes: '',
    });

    const [barcode, setBarcode] = useState('');

    // ── Initialization ───────────────────────────────────────────────────────
    useEffect(() => {
        async function loadData() {
            try {
                const [custs, items] = await Promise.all([
                    customerService.getAll(),
                    inventoryService.getAll()
                ]);
                setCustomers(Array.isArray(custs) ? custs : []);
                setInventory(Array.isArray(items) ? items : []);
            } catch (err) {
                setError('POS Engine: Failed to synchronize inventory data.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // ── Calculations ─────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
        const taxAmount = (subtotal * (Number(form.taxRate) || 0)) / 100;
        const grandTotal = subtotal + taxAmount - (Number(form.discountAmount) || 0);
        return { subtotal, taxAmount, grandTotal };
    }, [form.items, form.taxRate, form.discountAmount]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    function handleHeaderChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function addItem() {
        setForm((prev) => ({
            ...prev,
            items: [...prev.items, { itemId: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
        }));
    }

    function removeItem(index) {
        if (form.items.length === 1) return;
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    }

    function handleItemChange(index, field, value) {
        const newItems = [...form.items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'itemId') {
            const product = inventory.find(p => p.id == value || p.itemId == value);
            if (product) {
                // FIXED: Using sellingPrice from enriched DTO
                item.unitPrice = product.sellingPrice || 0;
                item.itemName = product.itemName;
            }
        }

        item.subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        newItems[index] = item;
        setForm((prev) => ({ ...prev, items: newItems }));
    }

    function handleBarcodeScan(e) {
        e.preventDefault();
        const code = barcode.trim();
        if (!code) return;

        const product = inventory.find(p => p.sku === code || p.itemId?.toString() === code || p.id?.toString() === code);
        
        if (product) {
            const existingIndex = form.items.findIndex(i => i.itemId == product.id);
            if (existingIndex > -1) {
                handleItemChange(existingIndex, 'quantity', Number(form.items[existingIndex].quantity) + 1);
            } else {
                const newItem = { 
                    itemId: product.id, 
                    quantity: 1, 
                    unitPrice: product.sellingPrice || 0,
                    subtotal: product.sellingPrice || 0,
                    itemName: product.itemName
                };
                setForm(prev => ({
                    ...prev,
                    items: [...prev.items.filter(i => i.itemId !== ''), newItem]
                }));
            }
            setBarcode('');
        } else {
            setError(`SKU "${code}" not found in current inventory.`);
            setTimeout(() => setError(null), 3000);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.customerId) {
            setError('System: No client selected for settlement.');
            return;
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
                paymentMode: form.paymentMode,
                splitPayments: form.paymentMode === 'SPLIT' ? form.splitPayments : null,
                notes: form.notes,
                items: form.items
                    .filter(i => i.itemId)
                    .map(i => ({
                        itemId: Number(i.itemId),
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice)
                    }))
            };

            const result = await invoiceService.create(payload);
            navigate(`/invoices/${result.id}`, { replace: true });
        } catch (err) {
            setError(err.message ?? 'Synchronization failed. Review ledger state.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <MainLayout title="Initializing Next-Gen POS...">
                <div className="flex h-96 flex-col items-center justify-center gap-6">
                    <Loader2 className="h-14 w-14 animate-spin text-blue-500 opacity-20" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Inventory Meta...</p>
                        <p className="mt-1 text-xs font-bold text-slate-300">Setting up your billing environment</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="POS Checkout">
            {/* Context Navigation */}
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600">
                        <ShoppingBag size={12} /> Point of Sale
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Checkout</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/invoices')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <button 
                        onClick={() => navigate('/invoices')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                        <Trash2 size={14} /> Discard Cart
                    </button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-8 p-6 rounded-3xl" onClose={() => setError(null)} />}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10 lg:grid-cols-12 mb-20 items-start">
                
                {/* ── CART AREA (CENTER) ────────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client Account</label>
                            <div className="relative group">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <select
                                    name="customerId"
                                    value={form.customerId}
                                    onChange={handleHeaderChange}
                                    className="w-full rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 pl-12 pr-6 py-4 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all appearance-none"
                                    required
                                >
                                    <option value="">Search customer...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Sale Date</label>
                            <input
                                type="date"
                                name="invoiceDate"
                                value={form.invoiceDate}
                                onChange={handleHeaderChange}
                                className="w-full rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Cart Table */}
                    <Card className="glass-card premium-shadow rounded-[3rem] overflow-hidden border-none transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 px-10 py-8 bg-white/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-8">
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tighter">Line Items</CardTitle>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Scanned cart inventory</p>
                                </div>
                                
                                <div className="relative group hidden xl:block">
                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                    <input 
                                        type="text"
                                        placeholder="Quick Scan (SKU)..."
                                        className="h-11 w-64 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none pl-12 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleBarcodeScan(e);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <Button type="button" variant="ghost" onClick={addItem} className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                <Plus size={24} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 dark:bg-slate-800/30 hover:bg-transparent border-none">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-10 py-5">Product</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Price</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-10">Total</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {form.items.map((item, index) => (
                                            <TableRow key={index} className="border-slate-50 dark:border-slate-800/50 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <TableCell className="pl-10 py-8">
                                                    <select
                                                        value={item.itemId}
                                                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                                        className="w-full border-none bg-transparent p-0 text-base font-black tracking-tight focus:ring-0 dark:text-white appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select Item</option>
                                                        {inventory.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.itemName} ({fmt(p.sellingPrice)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-16 border-none bg-transparent p-0 text-center text-sm font-black focus:ring-0 dark:text-white"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <p className="text-sm font-bold text-slate-500">{fmt(item.unitPrice)}</p>
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <p className="text-base font-black text-slate-900 dark:text-white tracking-tighter">{fmt(item.subtotal)}</p>
                                                </TableCell>
                                                <TableCell className="pr-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settlement Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <Card className="glass-card border-none premium-shadow rounded-[2.5rem] bg-white dark:bg-slate-900">
                             <CardHeader className="px-10 pt-10">
                                 <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Payment Strategy</CardTitle>
                             </CardHeader>
                             <CardContent className="p-10">
                                 <div className="grid grid-cols-2 gap-4">
                                     {[
                                         { id: 'CASH', label: 'Cash', icon: Banknote },
                                         { id: 'CARD', label: 'Card', icon: CreditCard },
                                         { id: 'UPI', label: 'Online', icon: Smartphone },
                                         { id: 'SPLIT', label: 'Split', icon: Layers },
                                     ].map((mode) => {
                                         const Icon = mode.icon;
                                         const isActive = form.paymentMode === mode.id;
                                         return (
                                             <button
                                                 key={mode.id}
                                                 type="button"
                                                 onClick={() => setForm(p => ({ ...p, paymentMode: mode.id }))}
                                                 className={cn(
                                                     "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300",
                                                     isActive 
                                                         ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 scale-[1.05]" 
                                                         : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                                                 )}
                                             >
                                                 <Icon size={24} className={cn("mb-3", isActive ? "text-white" : "text-blue-500")} />
                                                 <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                                             </button>
                                         );
                                     })}
                                 </div>
                             </CardContent>
                         </Card>

                         <Card className="glass-card border-none premium-shadow rounded-[2.5rem] bg-white dark:bg-slate-900">
                             <CardHeader className="px-10 pt-10">
                                 <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Transaction Notes</CardTitle>
                             </CardHeader>
                             <CardContent className="p-10">
                                 <textarea
                                     name="notes"
                                     value={form.notes}
                                     onChange={handleHeaderChange}
                                     rows={5}
                                     placeholder="Private memos..."
                                     className="w-full rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 text-sm font-bold focus:border-blue-500 focus:outline-none dark:text-white transition-all resize-none"
                                 />
                             </CardContent>
                         </Card>
                    </div>
                </div>

                {/* ── SETTLEMENT SUMMARY (SIDEBAR) ────────────────────────────────── */}
                <div className="lg:col-span-4 sticky top-10">
                    <Card className="bg-slate-950 text-white shadow-[0_35px_80px_-15px_rgba(15,23,42,0.6)] rounded-[3.5rem] overflow-hidden border-none p-12 relative group min-h-[600px] flex flex-col">
                        
                        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
                        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-[100px]" />

                        <div className="relative flex-1">
                            <div className="mb-10 text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Invoice Summary</div>
                            
                            <div className="space-y-8">
                                <div className="flex justify-between items-center group/row">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-hover/row:text-slate-300">Base Revenue</span>
                                    <span className="text-lg font-bold tracking-tight">{fmt(totals.subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-white/5 group/row">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-hover/row:text-slate-300">GST Factor</span>
                                        <div className="flex items-center bg-white/5 rounded-lg px-2 py-1">
                                            <input
                                                type="number"
                                                name="taxRate"
                                                value={form.taxRate}
                                                onChange={handleHeaderChange}
                                                className="w-10 bg-transparent text-center text-[10px] font-black focus:outline-none"
                                            />
                                            <span className="text-[9px] font-black text-slate-600">%</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400">+{fmt(totals.taxAmount)}</span>
                                </div>

                                <div className="flex justify-between items-center group/row pt-8">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-hover/row:text-slate-300">Adjustment</span>
                                    <div className="flex items-center bg-white/5 rounded-xl px-3 py-1.5 focus-within:bg-white/10 transition-all">
                                        <span className="text-[10px] font-bold text-slate-600 mr-2">₹</span>
                                        <input
                                            type="number"
                                            name="discountAmount"
                                            value={form.discountAmount}
                                            onChange={handleHeaderChange}
                                            className="w-24 bg-transparent text-right text-xs font-black focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-20 mt-10 border-t-2 border-dashed border-white/10">
                                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6 underline underline-offset-8 decoration-blue-500/30">Receivable Total</span>
                                    <div className="flex items-start">
                                        <span className="text-2xl font-black text-slate-600 mt-2 mr-1">₹</span>
                                        <h2 className="text-7xl font-black tracking-tighter tabular-nums text-white leading-none">
                                            {totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            <span className="text-2xl text-blue-500 font-bold">.00</span>
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 relative pt-8 border-t border-white/5">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-24 bg-blue-600 hover:bg-blue-500 text-white border-none rounded-[2.5rem] flex flex-col items-center justify-center gap-1 shadow-[0_15px_40px_-10px_rgba(37,99,235,0.5)] group transition-all duration-500 active:scale-95"
                            >
                                {submitting ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.3em]">
                                            Settle Now <CheckCircle2 size={16} className="group-hover:rotate-12 transition-transform" />
                                        </div>
                                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Post to ledger instantly</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {form.paymentMode === 'SPLIT' && (
                        <div className="mt-10 p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 space-y-6 animate-in slide-in-from-right-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Split Breakdown</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-2xl p-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Cash</span>
                                    <input 
                                        type="number" 
                                        className="w-24 text-right bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-white"
                                        value={form.splitPayments.cash} 
                                        onChange={(e) => setForm(p => ({ ...p, splitPayments: { ...p.splitPayments, cash: Number(e.target.value) } }))}
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-2xl p-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Card</span>
                                    <input 
                                        type="number" 
                                        className="w-24 text-right bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-white"
                                        value={form.splitPayments.card} 
                                        onChange={(e) => setForm(p => ({ ...p, splitPayments: { ...p.splitPayments, card: Number(e.target.value) } }))}
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-2xl p-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Online</span>
                                    <input 
                                        type="number" 
                                        className="w-24 text-right bg-transparent border-none p-0 text-sm font-black focus:ring-0 dark:text-white"
                                        value={form.splitPayments.upi} 
                                        onChange={(e) => setForm(p => ({ ...p, splitPayments: { ...p.splitPayments, upi: Number(e.target.value) } }))}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <div className="text-[10px] font-black uppercase text-slate-400">Variance</div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    Math.abs((form.splitPayments.cash + form.splitPayments.card + form.splitPayments.upi) - totals.grandTotal) < 0.01
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-rose-500/10 text-rose-500"
                                )}>
                                    {fmt(totals.grandTotal - (form.splitPayments.cash + form.splitPayments.card + form.splitPayments.upi))} off
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </MainLayout>
    );
}
ange={handleHeaderChange}
                                rows={4}
                                placeholder="Internal memos or public terms..."
                                className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm font-bold focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </CardContent>
                    </Card>
                </div>
            </form>
        </MainLayout>
    );
}
