import React, { useState, useEffect } from 'react';
import { Package, X, Check, Loader2, Info, Plus, AlertCircle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import itemService from '../services/itemService';
import categoryService from '../services/categoryService';
import unitService from '../services/unitService';
import taxRuleService from '../services/taxRuleService';

/**
 * ItemModal – Manual creation of new product definitions
 * Features inline creation for missing categories/units
 */
export default function ItemModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxRules, setTaxRules] = useState([]);

    const [showNewCat, setShowNewCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [showNewUnit, setShowNewUnit] = useState(false);
    const [newUnit, setNewUnit] = useState({ name: '', symbol: '' });

    const [form, setForm] = useState({
        name: '',
        barcode: '',
        categoryId: '',
        unitId: '',
        type: 'PRODUCT',
        sellingPrice: 0,
        costPrice: 0,
        taxRate: 0,
        taxRuleId: '',
        lowStockThreshold: 5,
        isActive: true,
        hasVariants: false,
        description: '',
        expiryDate: '',
        batchNo: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                name: initialData.name || initialData.itemName || '',
                barcode: initialData.barcode || '',
                type: initialData.type || 'PRODUCT',
                categoryId: initialData.categoryId?.toString() || '',
                unitId: initialData.unitId?.toString() || '',
                taxRuleId: initialData.taxRuleId?.toString() || '',
                expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : '',
                costPrice: initialData.costPrice || 0,
                sellingPrice: initialData.sellingPrice || 0,
                lowStockThreshold: initialData.lowStockThreshold || 5,
                batchNo: initialData.batchNo || ''
            });
        } else {
            setForm({
                name: '',
                barcode: '',
                categoryId: '',
                unitId: '',
                type: 'PRODUCT',
                sellingPrice: 0,
                costPrice: 0,
                taxRate: 0,
                taxRuleId: '',
                lowStockThreshold: 5,
                isActive: true,
                hasVariants: false,
                description: '',
                expiryDate: '',
                batchNo: ''
            });
        }
    }, [initialData, isOpen]);

    const loadDependencies = async () => {
        setLoading(true);
        setError(null);
        try {
            const [catsRes, unsRes, trsRes] = await Promise.allSettled([
                categoryService.getAll(),
                unitService.getAll(),
                taxRuleService.getAll()
            ]);

            const cats = catsRes.status === 'fulfilled' ? (Array.isArray(catsRes.value) ? catsRes.value : []) : [];
            const uns = unsRes.status === 'fulfilled' ? (Array.isArray(unsRes.value) ? unsRes.value : []) : [];
            const trs = trsRes.status === 'fulfilled' ? (Array.isArray(trsRes.value) ? trsRes.value : []) : [];

            setCategories(cats);
            setUnits(uns);
            setTaxRules(trs);

            // Set defaults safely
            setForm(f => ({
                ...f,
                categoryId: f.categoryId || (cats.length > 0 ? cats[0].id : ''),
                unitId: f.unitId || (uns.length > 0 ? uns[0].id : '')
            }));

            if (catsRes.status === 'rejected' || unsRes.status === 'rejected') {
                console.error('Some dependencies failed to load');
            }
        } catch {
            setError('Could not load categories or units. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

    const handleCreateCategory = async () => {
        if (!newCatName.trim()) return;
        try {
            const res = await categoryService.create({ name: newCatName });
            const newId = res.id;
            await loadDependencies();
            setForm(f => ({ ...f, categoryId: newId }));
            setShowNewCat(false);
            setNewCatName('');
        } catch {
            setError('Failed to create category.');
        }
    };

    const handleCreateUnit = async () => {
        if (!newUnit.name.trim() || !newUnit.symbol.trim()) return;
        try {
            const res = await unitService.create(newUnit);
            const newId = res.id;
            await loadDependencies();
            setForm(f => ({ ...f, unitId: newId }));
            setShowNewUnit(false);
            setNewUnit({ name: '', symbol: '' });
        } catch {
            setError('Failed to create unit.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.categoryId || !form.unitId) {
            setError('Please select or create a Category and Unit.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...form,
                categoryId: Number(form.categoryId),
                unitId: Number(form.unitId),
                sellingPrice: Number(form.sellingPrice),
                costPrice: Number(form.costPrice),
                taxRate: Number(form.taxRate),
                lowStockThreshold: Number(form.lowStockThreshold)
            };
            
            const idToUpdate = initialData?.itemId || initialData?.id;
            if (idToUpdate) {
                await itemService.update(idToUpdate, payload);
            } else {
                await itemService.create(payload);
            }
            
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to process item.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Item" : "Add New Item"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading List...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Item Name"
                                    placeholder="E.g. Wireless Mouse"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                label="Code / Barcode"
                                placeholder="FC-001"
                                value={form.barcode}
                                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                                required
                            />
                            <Input
                                label="Batch Number"
                                placeholder="B-123"
                                value={form.batchNo}
                                onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Expiry Date"
                                type="date"
                                value={form.expiryDate}
                                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Item Type</label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="PRODUCT">PRODUCT</option>
                                    <option value="SERVICE">SERVICE</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* ── Category ─────────────────────────────────────────────── */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</label>
                                    <button type="button" onClick={() => setShowNewCat(!showNewCat)} className="text-blue-500 hover:text-blue-600">
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {showNewCat ? (
                                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                                        <Input
                                            placeholder="New Category..."
                                            className="h-10 text-xs"
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                        />
                                        <Button type="button" size="sm" onClick={handleCreateCategory} className="h-10 px-3 bg-emerald-500 text-white">Add</Button>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                                        value={form.categoryId}
                                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* ── Unit ─────────────────────────────────────────────────── */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit</label>
                                    <button type="button" onClick={() => setShowNewUnit(!showNewUnit)} className="text-blue-500 hover:text-blue-600">
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {showNewUnit ? (
                                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                                        <Input placeholder="Full Name (e.g. Piece)" className="h-9 text-[10px]" value={newUnit.name} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} />
                                        <div className="flex gap-2">
                                            <Input placeholder="Short (pcs)" className="h-9 text-[10px]" value={newUnit.symbol} onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })} />
                                            <Button type="button" size="sm" onClick={handleCreateUnit} className="h-9 px-3 bg-emerald-500 text-white">Add</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                                        value={form.unitId}
                                        onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Cost Price (₹)" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required />
                            <Input label="Selling Price (₹)" type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Min Stock Alert" type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} required />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tax Rule</label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                                    value={form.taxRuleId}
                                    onChange={(e) => {
                                        const rule = taxRules.find(r => r.id.toString() === e.target.value);
                                        setForm({
                                            ...form,
                                            taxRuleId: e.target.value,
                                            taxRate: rule ? rule.rate : 0
                                        });
                                    }}
                                >
                                    <option value="">No Tax / Exempt</option>
                                    {taxRules.map(rule => (
                                        <option key={rule.id} value={rule.id}>{rule.name} ({rule.rate}%)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-100 animate-in shake-in">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle size={16} className="text-rose-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Database Constraint / Server Error</span>
                        </div>
                        <p className="text-xs font-bold text-rose-800 leading-relaxed">
                            {error}
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button type="button" variant="ghost" className="flex-1 font-bold" onClick={onClose}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-black uppercase tracking-widest shadow-lg shadow-blue-500/20" disabled={submitting || loading}>
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Save Item
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
