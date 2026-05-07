import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import Button from './ui/Button';
import staffService from '../services/staffService';
import toast from 'react-hot-toast';

export default function StaffAdvanceModal({ isOpen, onClose, onSuccess, staffId }) {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            await staffService.createAdvance({
                staffId,
                amount: parseFloat(amount),
                advanceDate: date,
                notes: reason || 'Salary Advance'
            });
            toast.success('Advance recorded successfully');
            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setReason('');
        } catch (error) {
            toast.error(error.message || 'Failed to record advance');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Record Advance</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Financial Disbursement Entry</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Advance Amount (₹)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="number"
                                required
                                placeholder="0.00"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-lg"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Issue</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="date"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason / Notes</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                placeholder="E.g. Medical emergency, Loan, etc."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium min-h-[100px]"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 py-4 rounded-2xl font-bold"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-500/20"
                            disabled={submitting}
                        >
                            {submitting ? 'Processing...' : 'Issue Advance'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
