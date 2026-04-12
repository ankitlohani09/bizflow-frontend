import React, { useState, useEffect } from 'react';
import { Loader2, Save, X, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import supplierService from '../services/supplierService';

/**
 * SupplierModal – Add or edit business vendors
 */
export default function SupplierModal({ isOpen, onClose, onSuccess, supplier = null }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        taxId: '', // GSTIN / TIN
    });

    useEffect(() => {
        if (isOpen) {
            if (supplier) {
                setForm({
                    name: supplier.name || '',
                    contactPerson: supplier.contactPerson || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    address: supplier.address || '',
                    city: supplier.city || '',
                    taxId: supplier.taxId || '',
                });
            } else {
                setForm({
                    name: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    taxId: '',
                });
            }
        }
    }, [isOpen, supplier]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (supplier) {
                await supplierService.update(supplier.id, form);
            } else {
                await supplierService.create(form);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message ?? 'Failed to save supplier details.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

                <Input
                    label="Company Name"
                    placeholder="E.g. Acme Components Ltd"
                    icon={<Building2 size={14} />}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Contact Person"
                        placeholder="John Doe"
                        icon={<User size={14} />}
                        value={form.contactPerson}
                        onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    />
                    <Input
                        label="Tax ID / GSTIN"
                        placeholder="Registration Number"
                        value={form.taxId}
                        onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="orders@vendor.com"
                        icon={<Mail size={14} />}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="+91..."
                        icon={<Phone size={14} />}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                </div>

                <Input
                    label="Full Address"
                    placeholder="Warehouse / Office address"
                    icon={<MapPin size={14} />}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                />

                <Input
                    label="City"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                />

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {supplier ? 'Update Vendor' : 'Save Supplier'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
