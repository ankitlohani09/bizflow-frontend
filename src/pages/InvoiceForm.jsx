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

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

/**
 * InvoiceForm – handles creating a new invoice with dynamic line items.
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
        taxRate: 18, // Default 18% GST
        discountAmount: 0,
        notes: '',
    });

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
                setError('Failed to load customers or inventory for selection.');
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
                item.unitPrice = product.price || product.unitPrice || 0;
                item.itemName = product.itemName;
            }
        }

        item.subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        newItems[index] = item;
        setForm((prev) => ({ ...prev, items: newItems }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.customerId) {
            setError('Please select a client to proceed.');
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
            setError(err.message ?? 'Failed to synchronize with billing service.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <MainLayout title="Generating Billing Environment...">
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing POS Cart...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Create Invoice">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">New Transaction</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Issue professional invoices and update your ledger instantly.</p>
                </div>
                <Button variant="ghost" onClick={() => navigate('/invoices')} className="text-slate-400 font-bold">
                    <X className="mr-2 h-4 w-4" /> Discard Draft
                </Button>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-20">
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Selection */}
                    <Card className="glass-card premium-shadow rounded-3xl overflow-hidden border-none transition-all duration-300">
                        <div className="h-2 bg-blue-600" />
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 p-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users size={12} className="text-blue-500" /> Client Selection
                                </label>
                                <select
                                    name="customerId"
                                    value={form.customerId}
                                    onChange={handleHeaderChange}
                                    className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    required
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Document Date</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    value={form.invoiceDate}
                                    onChange={handleHeaderChange}
                                    className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-bold focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card className="glass-card premium-shadow rounded-3xl overflow-hidden border-none transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 px-8 py-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cart Inventory</CardTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-500/10">
                                <Plus size={14} className="mr-1" /> Add Row
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent hover:bg-transparent border-none">
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-8">Item Description</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Rate</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right pr-8">Subtotal</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((item, index) => (
                                        <TableRow key={index} className="border-slate-50 dark:border-slate-800/50 group">
                                            <TableCell className="pl-8 py-6">
                                                <select
                                                    value={item.itemId}
                                                    onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                                    className="w-full border-none bg-transparent p-0 text-sm font-bold focus:ring-0 dark:text-white"
                                                >
                                                    <option value="">Select product...</option>
                                                    {inventory.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.itemName} (Stock: {p.availableQty})
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-16 mx-auto border-none bg-transparent p-0 text-center text-sm font-bold focus:ring-0 dark:text-white"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                    className="w-24 ml-auto border-none bg-transparent p-0 text-right text-sm font-bold focus:ring-0 dark:text-white"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right pr-8 font-black text-slate-900 dark:text-white">
                                                {fmt(item.subtotal)}
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
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

                <div className="space-y-8">
                    {/* Summary Panel */}
                    <Card className="bg-slate-950 text-white shadow-2xl rounded-3xl overflow-hidden border-none p-10 relative group">
                        {/* Interactive accent glow */}
                        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-all duration-1000" />
                        
                        <CardHeader className="p-0 mb-8 border-none bg-transparent">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500/80">Checkout Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-6">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-slate-500">Subtotal</span>
                                <span>{fmt(totals.subtotal)}</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-500">Tax / GST (%)</span>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={form.taxRate}
                                        onChange={handleHeaderChange}
                                        className="w-12 bg-transparent text-right font-black focus:outline-none border-b border-slate-800"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                    <span>Calculated Tax</span>
                                    <span>+ {fmt(totals.taxAmount)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm font-bold border-t border-slate-800 pt-6">
                                <span className="text-slate-500">Discount</span>
                                <input
                                    type="number"
                                    name="discountAmount"
                                    value={form.discountAmount}
                                    onChange={handleHeaderChange}
                                    className="w-24 bg-transparent text-right font-black focus:outline-none border-b border-slate-800"
                                />
                            </div>

                            <div className="py-8 border-t border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Total Amount</span>
                                    <span className="text-5xl font-black tracking-tighter tabular-nums text-white">
                                        {fmt(totals.grandTotal)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-8 rounded-2xl shadow-xl shadow-blue-500/40 glow-icon transition-all duration-300 active:scale-95"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : "Authorize & Proceed"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    <Card className="glass-card border-none premium-shadow rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleHeaderChange}
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
