import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, Package, ArrowRightLeft } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import inventoryService from '../services/inventoryService';
import itemService from '../services/itemService';

/**
 * StockMovementModal – record a manual stock adjustment (IN/OUT/ADJUST)
 */
export default function StockMovementModal({ isOpen, onClose, onSuccess, initialItem = null }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        itemId: '',
        movementType: 'IN', // IN, OUT, ADJUST
        quantity: 1,
        reason: '',
    });

    // Populate form if initialItem provided (quick action from list)
    useEffect(() => {
        if (initialItem && isOpen) {
            setForm(prev => ({ ...prev, itemId: initialItem.itemId || initialItem.id }));
        }
    }, [initialItem, isOpen]);

    // Fetch items catalog
    useEffect(() => {
        if (isOpen) {
            async function loadItems() {
                setLoading(true);
                try {
                    const data = await itemService.getAll();
                    setItems(Array.isArray(data) ? data : []);
                } catch (err) {
                    setError('Failed to load items catalog.');
                } finally {
                    setLoading(false);
                }
            }
            loadItems();
        } else {
            // Reset on close
            setForm({ itemId: '', movementType: 'IN', quantity: 1, reason: '' });
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.itemId) {
            setError('Please select an item.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await inventoryService.createStockMovement({
                itemId: Number(form.itemId),
                movementType: form.movementType,
                quantity: Number(form.quantity),
                reason: form.reason,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message ?? 'Failed to process stock movement.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Stock Adjustment">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <Package size={14} className="text-slate-400" /> Select Item
                            </label>
                            <select
                                value={form.itemId}
                                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={!!initialItem}
                            >
                                <option value="">Select product...</option>
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                    <ArrowRightLeft size={14} className="text-slate-400" /> Type
                                </label>
                                <select
                                    value={form.movementType}
                                    onChange={(e) => setForm({ ...form, movementType: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="IN">Stock In (Purchase/Return)</option>
                                    <option value="OUT">Stock Out (Sale/Loss)</option>
                                    <option value="TRANSFER">Internal Transfer (E.g. Move to Damaged)</option>
                                    <option value="ADJUST">Correction/Audit</option>
                                </select>
                            </div>

                            <Input
                                label="Quantity"
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                required
                            />
                        </div>

                        {form.movementType === 'TRANSFER' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From Category</label>
                                    <select className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold dark:text-white">
                                        <option value="AVAILABLE">Available</option>
                                        <option value="RESERVED">Reserved</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Category</label>
                                    <select className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold dark:text-white">
                                        <option value="DAMAGED">Damaged</option>
                                        <option value="EXPIRED">Expired</option>
                                        <option value="RESERVED">Reserved</option>
                                        <option value="AVAILABLE">Available</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Reason / Reference
                            </label>
                            <textarea
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                placeholder="E.g. Damaged goods, Correction, Supplier return..."
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                            />
                        </div>
                    </>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={submitting || loading}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Movement
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
