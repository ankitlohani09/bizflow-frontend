import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Trash2,
    Save,
    X,
    ShoppingCart,
    Building2,
    Package,
    Loader2,
} from 'lucide-react';
import purchaseService from '../services/purchaseService';
import supplierService from '../services/supplierService';
import itemService from '../services/itemService';
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

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * PurchaseForm – Comprehensive procurement engine
 */
export default function PurchaseForm() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        remarks: '',
        items: [
            { itemId: '', quantity: 1, purchasePrice: 0, total: 0 }
        ],
    });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [sups, items] = await Promise.all([
                    supplierService.getAll(),
                    itemService.getAll()
                ]);
                setSuppliers(Array.isArray(sups) ? sups : []);
                setCatalog(Array.isArray(items) ? items : []);
            } catch {
                setError('Failed to load procurement dependencies.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const totals = useMemo(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
        return { subtotal, grandTotal: subtotal };
    }, [form.items]);

    const addItem = () => {
        setForm(f => ({
            ...f,
            items: [...f.items, { itemId: '', quantity: 1, purchasePrice: 0, total: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (form.items.length === 1) return;
        const newItems = [...form.items];
        newItems.splice(index, 1);
        setForm(f => ({ ...f, items: newItems }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index][field] = value;

        if (field === 'itemId') {
            const prod = catalog.find(p => p.id.toString() === value.toString());
            if (prod) newItems[index].purchasePrice = prod.purchasePrice || 0;
        }

        newItems[index].total = newItems[index].quantity * newItems[index].purchasePrice;
        setForm(f => ({ ...f, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.supplierId) return setError('Please select a supplier.');
        if (form.items.some(i => !i.itemId)) return setError('Please select items for all rows.');

        setSubmitting(true);
        setError(null);
        try {
            await purchaseService.create({
                ...form,
                supplierId: Number(form.supplierId),
                totalAmount: totals.grandTotal,
            });
            navigate('/purchases');
        } catch {
            setError('Failed to record purchase.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MainLayout title="New Purchase">
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 opacity-20" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="New Purchase">
            <div className="mb-8 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">New Purchase</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Record Incoming Stock
                        </p>
                    </div>
                </div>
                <Button variant="ghost" onClick={() => navigate('/purchases')} className="h-10 px-6 rounded-xl hover:bg-slate-100 text-slate-500 font-bold gap-2">
                    <X size={18} /> Discard
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
                <div className="lg:col-span-8 space-y-8">
                    {error && <Alert variant="error" message={error} className="border-none bg-rose-50/50 backdrop-blur-md shadow-xl shadow-rose-500/10" onClose={() => setError(null)} />}

                    {/* ── Metadata Engine ────────────────────────────────────────── */}
                    <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] p-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Supplier</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <select
                                        value={form.supplierId}
                                        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                                        className="w-full h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Supplier...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Purchase Date</label>
                                <input
                                    type="date"
                                    value={form.purchaseDate}
                                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                                    className="w-full h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="RECEIVED">Received</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* ── Asset Procurement Table ─────────────────────────────────── */}
                    <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight border-none p-0">Purchase Items</CardTitle>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Products to be added</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-10 px-5 border-slate-100 hover:bg-slate-50 text-blue-600 font-black uppercase tracking-widest text-[9px] gap-2 rounded-xl">
                                <Plus size={16} /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="border-separate border-spacing-0">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/30 dark:bg-slate-800/30 hover:bg-transparent border-none">
                                        <TableHead className="pl-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[45%]">Product Name</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[20%]">Quantity</TableHead>
                                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[20%]">Buy Price</TableHead>
                                        <TableHead className="pr-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[15%]">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((item, idx) => (
                                        <TableRow key={idx} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/5 border-none transition-colors">
                                            <TableCell className="pl-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <button type="button" onClick={() => removeItem(idx)} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <select
                                                        value={item.itemId}
                                                        onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-base font-black text-slate-900 dark:text-white outline-none cursor-pointer"
                                                        required
                                                    >
                                                        <option value="">Select Product...</option>
                                                        {catalog.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || 'N/A'})</option>)}
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                                        className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <X size={14} className="rotate-45" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                        className="w-16 bg-transparent border-none text-center text-lg font-black text-slate-900 dark:text-white tabular-nums focus:ring-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                                                        className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 h-12 border border-transparent group-focus-within:border-blue-500/20 transition-all">
                                                    <span className="text-slate-300 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        onChange={(e) => updateItem(idx, 'purchasePrice', Number(e.target.value))}
                                                        className="w-24 bg-transparent border-none text-right text-sm font-black text-slate-900 dark:text-white tabular-nums focus:ring-0 outline-none"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-10 py-6 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{fmt(item.total)}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Accumulated</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Fulfillment Engine Sidebar ─────────────────────────────── */}
                <div className="lg:col-span-4">
                    <Card className="sticky top-8 border-none bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/30">
                        <div className="p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 h-64 w-64 translate-x-32 -translate-y-32 bg-blue-600/20 rounded-full blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Order Summary</p>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>

                                <div className="space-y-6 mb-12">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-widest">Total Items</span>
                                        <span className="text-lg font-black text-white">
                                            {form.items.length} {form.items.length === 1 ? 'Item' : 'Items'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-widest">Net Payable</span>
                                        <span className="text-lg font-black text-white">{fmt(totals.subtotal)}</span>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-800 mb-12">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 text-center">Total Payable</p>
                                    <p className="text-5xl font-black text-white text-center tracking-tighter tabular-nums drop-shadow-2xl">{fmt(totals.grandTotal)}</p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="animate-spin h-6 w-6" /> : (
                                        <>
                                            <Save size={24} />
                                            <span>Save Purchase</span>
                                        </>
                                    )}
                                </Button>

                                <div className="mt-8">
                                    <div className="p-6 rounded-[1.5rem] bg-slate-800/30 border border-slate-800/50 backdrop-blur-sm">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Remarks / Notes</label>
                                        <textarea
                                            value={form.remarks}
                                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                            className="w-full bg-transparent border-none text-slate-300 text-sm font-medium resize-none focus:ring-0 p-0 h-20 placeholder:text-slate-700"
                                            placeholder="Add any internal notes here..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </form>
        </MainLayout>
    );
}
