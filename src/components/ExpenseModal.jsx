import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, Bookmark, DollarSign, Calendar, CreditCard, AlignLeft, Plus } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import expenseService from '../services/expenseService';

/**
 * ExpenseModal – handles adding and editing expense records.
 */
export default function ExpenseModal({ isOpen, onClose, onSuccess, expense = null }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        categoryId: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        description: '',
        referenceNo: '',
    });

    // Reset or populate form
    useEffect(() => {
        if (isOpen) {
            if (expense) {
                setForm({
                    categoryId: expense.categoryId || '',
                    amount: expense.amount || '',
                    expenseDate: (expense.expenseDate || '').split('T')[0],
                    paymentMethod: expense.paymentMethod || 'CASH',
                    description: expense.description || '',
                    referenceNo: expense.referenceNo || '',
                });
            } else {
                setForm({
                    categoryId: '',
                    amount: '',
                    expenseDate: new Date().toISOString().split('T')[0],
                    paymentMethod: 'CASH',
                    description: '',
                    referenceNo: '',
                });
            }

            // Load categories
            async function loadCategories() {
                setLoading(true);
                try {
                    const data = await expenseService.getCategories();
                    setCategories(Array.isArray(data) ? data : []);
                } catch {
                    setError('Failed to load expense categories.');
                } finally {
                    setLoading(false);
                }
            }
            loadCategories();
        }
    }, [isOpen, expense]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...form,
                amount: Number(form.amount),
                categoryId: Number(form.categoryId),
                paymentModeName: form.paymentMethod,
                title: form.description || 'Expense', // Fallback to 'Expense' if empty
            };

            await expenseService.create(payload); // assuming create handles both or we'll add update
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message ?? 'Failed to save expense.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={expense ? 'Edit Expense' : 'Record New Expense'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                            <Bookmark size={14} className="text-slate-400" /> Category
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                required
                            >
                                <option value="">Select Category...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={async () => {
                                const name = window.prompt('Enter new category name:');
                                if (!name) return;
                                try {
                                    const result = await expenseService.createCategory({ name });
                                    const newCat = result.data || result;
                                    setCategories([...categories, newCat]);
                                    setForm(p => ({ ...p, categoryId: (newCat.id).toString() }));
                                } catch (err) {
                                    alert('Failed to create category.');
                                }
                            }} className="px-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400" title="Quick Add Category">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    <Input
                        label="Amount"
                        type="number"
                        step="0.01"
                        icon={<DollarSign size={14} />}
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Expense Date"
                        type="date"
                        icon={<Calendar size={14} />}
                        value={form.expenseDate}
                        onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                        required
                    />

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                            <CreditCard size={14} className="text-slate-400" /> Payment Method
                        </label>
                        <select
                            value={form.paymentMethod}
                            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                        </select>
                    </div>
                </div>

                <Input
                    label="Reference # (Optional)"
                    placeholder="E.g. Bill #, Transaction ID"
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                />

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <AlignLeft size={14} className="text-slate-400" /> Description
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        rows={3}
                        placeholder="What was this expense for?"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={submitting || loading}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {expense ? 'Update Record' : 'Record Expense'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
