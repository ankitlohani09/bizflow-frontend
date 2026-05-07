import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, User, Briefcase, Phone, Mail, DollarSign, Calendar, Shield } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import staffService from '../services/staffService';

const ROLES = [
    'ADMIN',
    'MANAGER',
    'SALES',
    'WAREHOUSE',
    'ACCOUNTANT',
    'HR',
    'OTHER'
];

/**
 * StaffModal – handles hiring new staff or updating existing records.
 */
export default function StaffModal({ isOpen, onClose, onSuccess, staff = null }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        role: 'SALES',
        email: '',
        phone: '',
        salary: '',
        pin: '',
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
    });

    useEffect(() => {
        if (isOpen) {
            if (staff) {
                setForm({
                    name: staff.name || '',
                    role: staff.role || 'SALES',
                    email: staff.email || '',
                    phone: staff.phone || '',
                    salary: staff.salary || '',
                    pin: staff.pin || '',
                    joinDate: (staff.joinDate || '').split('T')[0],
                    isActive: staff.isActive !== false,
                });
            } else {
                setForm({
                    name: '',
                    role: 'SALES',
                    email: '',
                    phone: '',
                    salary: '',
                    pin: '',
                    joinDate: new Date().toISOString().split('T')[0],
                    isActive: true,
                });
            }
        }
    }, [isOpen, staff]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...form,
                salary: Number(form.salary),
            };

            if (staff) {
                await staffService.update(staff.id, payload);
            } else {
                await staffService.create(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message ?? 'Failed to save staff record.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={staff ? 'Edit Staff Member' : 'Hire New Staff'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

                <Input
                    label="Full Name"
                    placeholder="E.g. John Doe"
                    icon={<User size={14} />}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Briefcase size={14} className="text-slate-400" /> Professional Role
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Salary"
                        type="number"
                        placeholder="0.00"
                        icon={<DollarSign size={14} />}
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        icon={<Mail size={14} />}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="e.g. +91 999 000 0000"
                        icon={<Phone size={14} />}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Join Date"
                        type="date"
                        icon={<Calendar size={14} />}
                        value={form.joinDate}
                        onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    />
                    <Input
                        label="Attendance PIN (4-Digits)"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        icon={<Shield size={14} />}
                        value={form.pin}
                        onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    />
                    <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg border border-transparent hover:bg-slate-50 transition-colors">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={form.isActive}
                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700">Active Employment</span>
                                <span className="text-[10px] text-slate-400 leading-tight">Disable to mark as former employee</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {staff ? 'Update Profile' : 'Confirm Hiring'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
