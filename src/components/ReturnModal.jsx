import React, { useState, useEffect } from 'react';
import { RefreshCcw, Save, X, AlertOctagon } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import returnService from '../services/returnService';
import paymentModeService from '../services/paymentModeService';

export default function ReturnModal({ isOpen, onClose, onSuccess, invoice }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [paymentModes, setPaymentModes] = useState([]);
    const [form, setForm] = useState({
        itemId: '',
        quantity: 1,
        condition: 'GOOD', // GOOD, DAMAGED, EXPIRED
        reason: '',
        paymentModeId: '',
        refundAmount: ''
    });

    const activeItem = invoice?.items?.find(i => i.itemId === Number(form.itemId)) || invoice?.items?.find(i => i.id === Number(form.itemId));

    useEffect(() => {
        const loadPaymentModes = async () => {
            try {
                const data = await paymentModeService.getAll();
                setPaymentModes(data);
                
                // Auto-select based on invoice
                if (invoice?.payments?.length) {
                    const primaryPayment = invoice.payments[0];
                    const mode = data.find(m => m.id === primaryPayment.paymentModeId || m.name === primaryPayment.paymentModeName);
                    if (mode) {
                        setForm(prev => ({ ...prev, paymentModeId: mode.id }));
                    } else if (data.length > 0) {
                        setForm(prev => ({ ...prev, paymentModeId: data[0].id }));
                    }
                } else if (data.length > 0) {
                    setForm(prev => ({ ...prev, paymentModeId: data[0].id }));
                }
            } catch (err) {
                console.error('Failed to load payment modes', err);
            }
        };

        if (isOpen) {
            loadPaymentModes();
        }
    }, [isOpen, invoice]);

    useEffect(() => {
        if (activeItem) {
            const actualUnitPrice = activeItem.lineTotal / activeItem.quantity;
            const calculatedRefund = Number(form.quantity) * actualUnitPrice;
            setForm(prev => ({ ...prev, refundAmount: calculatedRefund.toFixed(2) }));
        }
    }, [form.itemId, form.quantity, activeItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.itemId) {
            setError('Please select an item to return.');
            return;
        }

        const qty = Number(form.quantity);
        const maxQty = activeItem?.remainingQuantity !== undefined ? activeItem.remainingQuantity : (activeItem?.quantity || 1);

        if (qty <= 0) {
            setError('Quantity must be greater than 0.');
            return;
        }

        if (qty > maxQty) {
            setError(`Quantity cannot exceed remaining returnable quantity (${maxQty}).`);
            return;
        }

        if (!form.paymentModeId) {
            setError('Please select a refund mode.');
            return;
        }

        setSubmitting(true);
        try {
            const qty = Number(form.quantity);
            const totalRefund = Number(form.refundAmount);
            const returnUnitPrice = totalRefund / qty;

            await returnService.processReturn({
                invoiceId: invoice.id,
                paymentModeId: Number(form.paymentModeId),
                reason: form.reason,
                totalRefund: totalRefund,
                items: [
                    {
                        itemId: Number(form.itemId),
                        quantity: qty,
                        unitPrice: returnUnitPrice,
                        lineTotal: totalRefund,
                        conditionType: form.condition
                    }
                ]
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
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
                    <label htmlFor="item-select" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Item for Return</label>
                    <select 
                        id="item-select"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                        value={form.itemId}
                        onChange={(e) => setForm({...form, itemId: e.target.value})}
                        required
                    >
                        <option value="">Select an item...</option>
                        {invoice?.items?.map(item => (
                            <option key={item.itemId || item.id} value={item.itemId || item.id}>
                                {item.itemName} (Purchased: {item.quantity}, Left: {item.remainingQuantity !== undefined ? item.remainingQuantity : item.quantity})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input 
                            label="Quantity" 
                            type="number" 
                            min="1"
                            max={activeItem?.remainingQuantity !== undefined ? activeItem.remainingQuantity : (activeItem?.quantity || 1)} 
                            value={form.quantity}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || Number(val) >= 1) {
                                    setForm({...form, quantity: val});
                                }
                            }}
                            onFocus={(e) => e.target.select()}
                        />
                        {activeItem && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1.5 ml-1">
                                Max Returnable: {activeItem.remainingQuantity !== undefined ? activeItem.remainingQuantity : activeItem.quantity}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="condition-select" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Condition</label>
                        <select 
                            id="condition-select"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                            value={form.condition}
                            onChange={(e) => setForm({...form, condition: e.target.value})}
                        >
                            <option value="GOOD">Good (Back to Shelf)</option>
                            <option value="DAMAGED">Damaged / Defected</option>
                            <option value="EXPIRED">Expired / Dead Stock</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Input 
                            label="Refund Amount" 
                            type="number" 
                            step="0.01"
                            value={form.refundAmount}
                            onChange={(e) => setForm({...form, refundAmount: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="refund-mode-select" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Refund Mode</label>
                        <select 
                            id="refund-mode-select"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                            value={form.paymentModeId}
                            onChange={(e) => setForm({...form, paymentModeId: e.target.value})}
                            required
                        >
                            {paymentModes.map(mode => (
                                <option key={mode.id} value={mode.id}>{mode.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="reason-textarea" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Return Reason</label>
                    <textarea 
                        id="reason-textarea"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-3 text-sm font-bold dark:text-white"
                        rows={2}
                        placeholder="E.g. Size mismatch, defective unit..."
                        value={form.reason}
                        onChange={(e) => setForm({...form, reason: e.target.value})}
                    />
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20 animate-in shake-in">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertOctagon size={16} className="text-rose-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Error</span>
                        </div>
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-400 leading-relaxed">
                            {error}
                        </p>
                    </div>
                )}

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
