import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Minus,
    Trash2,
    Save,
    X,
    ShoppingCart,
    Building2,
    Package,
    Loader2,
    Barcode,
} from 'lucide-react';
import purchaseService from '../services/purchaseService';
import supplierService from '../services/supplierService';
import itemService from '../services/itemService';
import categoryService from '../services/categoryService';
import unitService from '../services/unitService';
import taxRuleService from '../services/taxRuleService';
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
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [scannedSku, setScannedSku] = useState('');
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxRules, setTaxRules] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        categoryId: '',
        unitId: '',
        purchasePrice: '',
        sellingPrice: '',
        taxRate: '0'
    });

    const [form, setForm] = useState({
        supplierId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'UNPAID',
        remarks: '',
        items: [
            { itemId: '', quantity: 1, purchasePrice: 0, total: 0, batchNo: '', expiryDate: '' }
        ],
    });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [sups, items, cats, uts, taxes] = await Promise.all([
                    supplierService.getAll(),
                    itemService.getAll(),
                    categoryService.getAll().catch(() => []),
                    unitService.getAll().catch(() => []),
                    taxRuleService.getAll().catch(() => [])
                ]);
                setSuppliers(Array.isArray(sups) ? sups : []);
                setCatalog(Array.isArray(items) ? items : []);
                setCategories(Array.isArray(cats) ? cats : []);
                setUnits(Array.isArray(uts) ? uts : []);
                setTaxRules(Array.isArray(taxes) ? taxes : []);
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
            items: [...f.items, { itemId: '', quantity: 1, purchasePrice: 0, total: 0, batchNo: '', expiryDate: '' }]
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
            const mappedItems = form.items.map(item => ({
                itemId: Number(item.itemId),
                quantity: Number(item.quantity),
                unitCost: Number(item.purchasePrice),
                lineTotal: Number(item.total),
                batchNo: item.batchNo || null,
                expiryDate: item.expiryDate || null,
            }));

            await purchaseService.create({
                ...form,
                supplierId: Number(form.supplierId),
                grandTotal: totals.grandTotal,
                subtotal: totals.subtotal,
                paymentStatus: form.status,
                items: mappedItems,
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
            {/* Header */}
            <div className="mb-6 flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight leading-none">New Purchase</h1>
                        <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Record Incoming Stock
                        </p>
                    </div>
                </div>
                <Button variant="ghost" onClick={() => navigate('/purchases')} className="h-10 px-6 rounded-xl hover:bg-slate-100 text-slate-600 font-bold gap-2">
                    <X size={18} /> Discard
                </Button>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* Metadata Row */}
            <div className="enterprise-card p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Supplier</label>
                        <select
                            value={form.supplierId}
                            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                            className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            required
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Purchase Date</label>
                        <input
                            type="date"
                            value={form.purchaseDate}
                            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                            className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        >
                            <option value="UNPAID">Unpaid</option>
                            <option value="PAID">Paid</option>
                            <option value="PARTIAL">Partial</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Content Split Layout */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto h-[calc(100vh-340px)] overflow-hidden">
                
                {/* Left Column: Table */}
                <div className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
                    {/* Barcode Scan */}
                    <div className="enterprise-card p-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Scan Barcode or Search Product..."
                                className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const sku = e.target.value.trim();
                                        if (!sku) return;
                                        
                                        const product = catalog.find(p => p.sku === sku || p.id.toString() === sku);
                                        if (product) {
                                            const existingIndex = form.items.findIndex(i => i.itemId.toString() === product.id.toString());
                                            if (existingIndex !== -1) {
                                                updateItem(existingIndex, 'quantity', form.items[existingIndex].quantity + 1);
                                            } else {
                                                setForm(f => ({
                                                    ...f,
                                                    items: [...f.items, { itemId: product.id, quantity: 1, purchasePrice: product.purchasePrice || 0, total: product.purchasePrice || 0 }]
                                                }));
                                            }
                                        } else {
                                            setScannedSku(sku);
                                            setIsQuickAddOpen(true);
                                        }
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="enterprise-card flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Purchase Items</h3>
                                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Products to be added</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-10 px-4 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 font-semibold uppercase tracking-widest text-[12px] gap-2 rounded-xl">
                                <Plus size={14} /> Add Item
                            </Button>
                        </div>
                        
                        <div className="overflow-auto flex-1">
                            <Table className="border-separate border-spacing-0">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/30 dark:bg-slate-800/30 hover:bg-transparent border-none">
                                        <TableHead className="pl-6 py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 w-[30%]">Product Name</TableHead>
                                        <TableHead className="py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 w-[15%]">Batch No</TableHead>
                                        <TableHead className="py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 w-[15%]">Expiry</TableHead>
                                        <TableHead className="py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 text-center w-[15%]">Quantity</TableHead>
                                        <TableHead className="py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 text-right w-[15%]">Buy Price</TableHead>
                                        <TableHead className="pr-6 py-4 text-[12px] font-semibold uppercase tracking-widest text-slate-400 text-right w-[10%]">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((item, idx) => (
                                        <TableRow key={idx} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/5 border-none transition-colors">
                                            <TableCell className="pl-6 py-3">
                                                <div className="flex items-center gap-4">
                                                    <button type="button" onClick={() => removeItem(idx)} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <select
                                                        value={item.itemId}
                                                        onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
                                                        required
                                                    >
                                                        <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Select Product...</option>
                                                        {catalog.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{p.name} ({p.sku || 'N/A'})</option>)}
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <input
                                                    type="text"
                                                    value={item.batchNo || ''}
                                                    onChange={(e) => updateItem(idx, 'batchNo', e.target.value)}
                                                    placeholder="Batch..."
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 h-10 border border-transparent text-sm font-semibold text-slate-900 dark:text-white focus:ring-0 outline-none"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <input
                                                    type="date"
                                                    value={item.expiryDate || ''}
                                                    onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 h-10 border border-transparent text-sm font-semibold text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
                                                />
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                                        className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                        className="w-12 bg-transparent border-none text-center text-sm font-semibold text-slate-900 dark:text-white tabular-nums focus:ring-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                                                        className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 h-10 border border-transparent group-focus-within:border-blue-500/20 transition-all">
                                                    <span className="text-slate-300 font-bold text-[12px]">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        onChange={(e) => updateItem(idx, 'purchasePrice', Number(e.target.value))}
                                                        className="w-20 bg-transparent border-none text-right text-sm font-semibold text-slate-900 dark:text-white tabular-nums focus:ring-0 outline-none"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 py-3 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums tracking-tighter">{fmt(item.total)}</span>
                                                    <span className="text-[12px] font-semibold text-slate-300 uppercase tracking-widest mt-1">Accumulated</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-2">
                    <div className="enterprise-card p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-600">Order Summary</p>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-slate-500">
                                <span className="text-[12px] font-bold uppercase tracking-widest">Total Items</span>
                                <span className="text-base font-semibold text-slate-900">
                                    {form.items.length} {form.items.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                                <span className="text-[12px] font-bold uppercase tracking-widest">Net Payable</span>
                                <span className="text-base font-semibold text-slate-900">{fmt(totals.subtotal)}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 mb-8">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-600 mb-2 text-center">Total Payable</p>
                            <p className="text-4xl font-semibold text-slate-900 text-center tracking-tighter tabular-nums">{fmt(totals.grandTotal)}</p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <label className="text-[12px] font-semibold text-slate-600 uppercase tracking-widest mb-2 block">Remarks / Notes</label>
                                <textarea
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    className="w-full bg-transparent border-none text-slate-700 text-sm font-medium resize-none focus:ring-0 p-0 h-16 placeholder:text-slate-400"
                                    placeholder="Add any internal notes here..."
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Purchase</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Quick Add Product Modal */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-2xl border border-slate-100 dark:border-slate-800 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Add New Product</h3>
                                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Add full details to inventory</p>
                            </div>
                            <button type="button" onClick={() => setIsQuickAddOpen(false)} className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Barcode / SKU</label>
                                    <input
                                        type="text"
                                        value={scannedSku}
                                        readOnly
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 outline-none transition-all cursor-not-allowed"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Product Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="Enter product name..."
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                                    <select
                                        value={newProduct.categoryId}
                                        onChange={async (e) => {
                                            if (e.target.value === 'NEW_CATEGORY') {
                                                const name = prompt('Enter new category name:');
                                                if (name) {
                                                    try {
                                                        const result = await categoryService.create({ name });
                                                        setCategories([...categories, result]);
                                                        setNewProduct({ ...newProduct, categoryId: result.id });
                                                    } catch (err) {
                                                        alert('Failed to add category!');
                                                    }
                                                }
                                            } else {
                                                setNewProduct({ ...newProduct, categoryId: e.target.value });
                                            }
                                        }}
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    >
                                        <option value="">Select Category...</option>
                                        <option value="NEW_CATEGORY">+ Add New Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Unit</label>
                                    <select
                                        value={newProduct.unitId}
                                        onChange={async (e) => {
                                            if (e.target.value === 'NEW_UNIT') {
                                                const name = prompt('Enter new unit name (e.g. Kg, Pcs):');
                                                if (name) {
                                                    try {
                                                        const result = await unitService.create({ name });
                                                        setUnits([...units, result]);
                                                        setNewProduct({ ...newProduct, unitId: result.id });
                                                    } catch (err) {
                                                        alert('Failed to add unit!');
                                                    }
                                                }
                                            } else {
                                                setNewProduct({ ...newProduct, unitId: e.target.value });
                                            }
                                        }}
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    >
                                        <option value="">Select Unit...</option>
                                        <option value="NEW_UNIT">+ Add New Unit...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Purchase Price</label>
                                    <input
                                        type="number"
                                        value={newProduct.purchasePrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Selling Price</label>
                                    <input
                                        type="number"
                                        value={newProduct.sellingPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-wider">Tax Rate (%)</label>
                                    <select
                                        value={newProduct.taxRate}
                                        onChange={async (e) => {
                                            if (e.target.value === 'NEW_TAX') {
                                                const name = prompt('Enter new tax name (e.g. GST 18%):');
                                                const rate = prompt('Enter tax rate (%):');
                                                if (name && rate) {
                                                    try {
                                                        const result = await taxRuleService.create({ name, rate: Number(rate), taxType: 'PERCENTAGE' });
                                                        setTaxRules([...taxRules, result]);
                                                        setNewProduct({ ...newProduct, taxRate: result.rate });
                                                    } catch (err) {
                                                        alert('Failed to add tax rule!');
                                                    }
                                                }
                                            } else {
                                                setNewProduct({ ...newProduct, taxRate: e.target.value });
                                            }
                                        }}
                                        className="w-full h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    >
                                        <option value="0">No Tax (0%)</option>
                                        <option value="NEW_TAX">+ Add New Tax Rule...</option>
                                        {taxRules.map(t => <option key={t.id} value={t.rate}>{t.name} ({t.rate}%)</option>)}
                                    </select>
                                </div>

                                <div className="pt-6">
                                    <Button
                                        type="button"
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                        onClick={async () => {
                                            if (!newProduct.name || !newProduct.purchasePrice || !newProduct.sellingPrice) {
                                                return alert('Please fill Name, Purchase Price and Selling Price!');
                                            }
                                            
                                            try {
                                                const selectedTaxRule = taxRules.find(t => t.rate === Number(newProduct.taxRate));
                                                
                                                const payload = {
                                                    barcode: scannedSku,
                                                    name: newProduct.name,
                                                    costPrice: Number(newProduct.purchasePrice),
                                                    sellingPrice: Number(newProduct.sellingPrice),
                                                    taxRate: Number(newProduct.taxRate),
                                                    type: 'PRODUCT',
                                                    isActive: true,
                                                    hasVariants: false
                                                };

                                                if (selectedTaxRule) payload.taxRuleId = selectedTaxRule.id;
                                                if (newProduct.categoryId) payload.categoryId = Number(newProduct.categoryId);
                                                if (newProduct.unitId) payload.unitId = Number(newProduct.unitId);

                                                const result = await itemService.create(payload);
                                                
                                                // Update catalog
                                                setCatalog([...catalog, result]);
                                                
                                                // Add to table
                                                setForm(f => ({
                                                    ...f,
                                                    items: [...f.items, { itemId: result.id, quantity: 1, purchasePrice: result.purchasePrice || 0, total: result.purchasePrice || 0 }]
                                                }));
                                                
                                                // Reset form
                                                setNewProduct({
                                                    name: '',
                                                    categoryId: '',
                                                    unitId: '',
                                                    purchasePrice: '',
                                                    sellingPrice: '',
                                                    taxRate: '0'
                                                });
                                                
                                                setIsQuickAddOpen(false);
                                            } catch (err) {
                                                alert('Failed to add product!');
                                            }
                                        }}
                                    >
                                        <Save size={16} /> Save Product
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
