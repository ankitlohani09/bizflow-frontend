import React, { useState } from 'react';
import { X, CheckCircle, Clock, Calendar, FileText } from 'lucide-react';
import Button from './ui/Button';
import staffService from '../services/staffService';
import toast from 'react-hot-toast';

export default function AttendanceModal({ isOpen, onClose, onSuccess, staffId, staffName }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('PRESENT');
    const [checkIn, setCheckIn] = useState('09:00');
    const [checkOut, setCheckOut] = useState('18:00');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await staffService.markAttendance({
                staffId,
                date,
                status,
                checkIn: status === 'PRESENT' || status === 'HALF_DAY' ? checkIn : null,
                checkOut: status === 'PRESENT' || status === 'HALF_DAY' ? checkOut : null,
                notes
            });
            toast.success(`Attendance marked for ${staffName}`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Mark Attendance</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Staff: {staffName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Attendance Date</label>
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
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                        status === s 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(status === 'PRESENT' || status === 'HALF_DAY') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Check In</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="time"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Check Out</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="time"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                placeholder="Any specific notes for the day..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium min-h-[80px] text-sm"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
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
                            {submitting ? 'Marking...' : 'Save Attendance'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
