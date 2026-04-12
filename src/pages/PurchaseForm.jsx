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
            } catch (err) {
                setError('Failed to load procurement dependencies.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // ── Calculations ──────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        const subtotal = form.items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
        return { subtotal, grandTotal: subtotal };
    }, [form.items]);

    // ── Handlers ──────────────────────────────────────────────────────────────
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
        
        // Auto-fill price if item selected
        if (field === 'itemId') {
            const prod = catalog.find(p => p.id.toString() === value.toString());
            if (prod) newItems[index].purchasePrice = prod.purchasePrice || 0;
        }

        // Calculate line total
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
        } catch (err) {
            setError(err.message ?? 'Failed to record purchase.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <MainLayout title="New Purchase">
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Record Procurement">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Order</h1>
                    <p className="text-sm text-slate-500">Record incoming stock and update procurement logs.</p>
                </div>
                <Button variant="ghost" onClick={() => navigate('/purchases')} className="gap-2">
                    <X size={16} /> Cancel
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto">
                {error && <Alert variant="error" message={error} className="shadow-lg" onClose={() => setError(null)} />}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ── Left Column: Metadata ───────────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Building2 size={16} /> Vendor Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Supplier</label>
                                    <select
                                        value={form.supplierId}
                                        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-shadow"
                                        required
                                    >
                                        <option value="">Select Vendor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <Input
                                    label="Purchase Date"
                                    type="date"
                                    value={form.purchaseDate}
                                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                                    required
                                />

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Order Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-shadow"
                                    >
                                        <option value="PENDING">Pending (Ordered)</option>
                                        <option value="PAID">Paid (Financials cleared)</option>
                                        <option value="RECEIVED">Received (Stock Added)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span>Items ({form.items.length})</span>
                                        <span>{fmt(totals.subtotal)}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-black text-xl text-slate-900">
                                        <span>Total</span>
                                        <span>{fmt(totals.grandTotal)}</span>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full mt-6 bg-slate-900 hover:bg-black text-white gap-2 py-6 rounded-xl text-lg font-bold shadow-xl"
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={20} />}
                                    Record Purchase
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right Column: Items ──────────────────────────────────────── */}
                    <Card className="lg:col-span-2 shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b border-slate-100">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package size={20} className="text-slate-400" /> Procurement Items
                                </CardTitle>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 border-slate-200 hover:bg-white hover:border-slate-400">
                                <Plus size={16} /> Add Link
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/10">
                                    <TableRow>
                                        <TableHead className="w-[45%]">Product</TableHead>
                                        <TableHead className="w-[15%]">Qty</TableHead>
                                        <TableHead className="w-[20%]">Buy Price</TableHead>
                                        <TableHead className="w-[15%] text-right text-xs uppercase tracking-widest text-slate-400 font-bold">Total</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/30 transition-colors group">
                                            <TableCell>
                                                <select
                                                    value={item.itemId}
                                                    onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900"
                                                    required
                                                >
                                                    <option value="">Select Item...</option>
                                                    {catalog.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || 'N/A'})</option>)}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 group-hover:bg-white rounded px-2 transition-colors">
                                                    <span className="text-slate-400 text-xs font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        onChange={(e) => updateItem(idx, 'purchasePrice', Number(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-1"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-900 text-sm">
                                                {fmt(item.total)}
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </MainLayout>
    );
}
