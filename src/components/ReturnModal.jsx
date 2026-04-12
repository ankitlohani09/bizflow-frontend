import React, { useState } from 'react';
import { RefreshCcw, Save, X, AlertOctagon } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import returnService from '../services/returnService';

export default function ReturnModal({ isOpen, onClose, onSuccess, invoice }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        itemId: '',
        quantity: 1,
        condition: 'AVAILABLE', // AVAILABLE, DAMAGED, EXPIRED
        reason: ''
    });

    const activeItem = invoice?.items?.find(i => i.itemId === Number(form.itemId)) || invoice?.items?.find(i => i.id === Number(form.itemId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await returnService.processReturn({
                invoiceId: invoice.id,
                ...form,
                itemId: Number(form.itemId),
                quantity: Number(form.quantity)
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Return processing failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Process Return">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4 border border-amber-100 dark:border-amber-500/20 flex gap-4">
                    <AlertOctagon className="text-amber-500 shrink-0" size={20} />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tight">
                        Confirming a return will automatically restore stock to your selected inventory category.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Item for Return</label>
                    <select 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                        value={form.itemId}
                        onChange={(e) => setForm({...form, itemId: e.target.value})}
                        required
                    >
                        <option value="">Select an item...</option>
                        {invoice?.items?.map(item => (
                            <option key={item.itemId || item.id} value={item.itemId || item.id}>
                                {item.itemName} (Purchase: {item.quantity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Quantity" 
                        type="number" 
                        max={activeItem?.quantity || 1} 
                        value={form.quantity}
                        onChange={(e) => setForm({...form, quantity: e.target.value})}
                    />
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Condition</label>
                        <select 
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                            value={form.condition}
                            onChange={(e) => setForm({...form, condition: e.target.value})}
                        >
                            <option value="AVAILABLE">Good (Back to Shelf)</option>
                            <option value="DAMAGED">Damaged / Defected</option>
                            <option value="EXPIRED">Expired / Dead Stock</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Return Reason</label>
                    <textarea 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                        rows={2}
                        placeholder="E.g. Size mismatch, defective unit..."
                        value={form.reason}
                        onChange={(e) => setForm({...form, reason: e.target.value})}
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button type="button" variant="ghost" className="flex-1 font-bold" onClick={onClose}>Cancel</Button>
                    <Button type="submit" className="flex-1 bg-slate-900 text-white gap-2 font-black uppercase tracking-widest" disabled={submitting}>
                        {submitting ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                        Authorize Return
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
