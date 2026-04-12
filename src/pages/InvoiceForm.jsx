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
        if (form.items.length === 1) return; // Must have at least one item
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    }

    function handleItemChange(index, field, value) {
        const newItems = [...form.items];
        const item = { ...newItems[index], [field]: value };

        // If item selected, auto-fill price from inventory
        if (field === 'itemId') {
            const product = inventory.find(p => p.id == value || p.itemId == value);
            if (product) {
                item.unitPrice = product.price || product.unitPrice || 0;
            }
        }

        // recalculate item subtotal
        item.subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        newItems[index] = item;

        setForm((prev) => ({ ...prev, items: newItems }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.customerId) {
            setError('Please select a customer.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                customerId: Number(form.customerId),
                invoiceDate: form.invoiceDate,
                taxAmount: totals.taxAmount,
                discountAmount: Number(form.discountAmount),
                grandTotal: totals.grandTotal,
                notes: form.notes,
                items: form.items
                    .filter(i => i.itemId) // remove empty rows
                    .map(i => ({
                        itemId: Number(i.itemId),
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice)
                    }))
            };

            const result = await invoiceService.create(payload);
            navigate(`/invoices/${result.id || ''}`, { replace: true });
        } catch (err) {
            setError(err.message ?? 'Failed to create invoice.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <MainLayout title="Create Invoice">
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Create New Invoice">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
                    <p className="text-sm text-slate-500">Generate a new sale record and update inventory.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* ── Left Column: Header Info ────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                    Invoice Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                        <Users size={14} className="text-blue-500" /> Customer
                                    </label>
                                    <select
                                        name="customerId"
                                        value={form.customerId}
                                        onChange={handleHeaderChange}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Invoice Date"
                                    name="invoiceDate"
                                    type="date"
                                    value={form.invoiceDate}
                                    onChange={handleHeaderChange}
                                    required
                                />
                            </CardContent>
                        </Card>

                        {/* ── Items Table ─────────────────────────────────── */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                    Line Items
                                </CardTitle>
                                <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <Plus size={16} className="mr-1" /> Add Row
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-1/2">Product / Item</TableHead>
                                            <TableHead className="w-16">Qty</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {form.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <select
                                                        value={item.itemId}
                                                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                                                        className="w-full rounded-md border-0 bg-transparent p-0 text-sm focus:ring-0"
                                                    >
                                                        <option value="">Select product...</option>
                                                        {inventory.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.itemName} ({p.availableQty} available)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                        className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {fmt(item.subtotal)}
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors"
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

                    {/* ── Right Column: Totals ────────────────────────────── */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="font-semibold">{fmt(totals.subtotal)}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Tax (%)</span>
                                        <input
                                            type="number"
                                            name="taxRate"
                                            value={form.taxRate}
                                            onChange={handleHeaderChange}
                                            className="w-16 bg-transparent text-right font-semibold focus:outline-none border-b border-slate-700"
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 italic">
                                        <span>Estimated Tax</span>
                                        <span>+ {fmt(totals.taxAmount)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Discount (flat)</span>
                                    <input
                                        type="number"
                                        name="discountAmount"
                                        value={form.discountAmount}
                                        onChange={handleHeaderChange}
                                        className="w-24 bg-transparent text-right font-semibold focus:outline-none border-b border-slate-700"
                                    />
                                </div>

                                <div className="my-2 border-t border-slate-800 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-bold">Total</span>
                                        <span className="text-2xl font-black text-blue-400">
                                            {fmt(totals.grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full mt-4 gap-2 bg-blue-600 hover:bg-blue-500 py-6 text-base shadow-lg"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Finalize Invoice
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Internal Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleHeaderChange}
                                    rows={4}
                                    placeholder="Add any additional terms or notes..."
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </MainLayout>
    );
}
