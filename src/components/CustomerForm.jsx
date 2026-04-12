import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import customerService from '../services/customerService';

/**
 * EMPTY_FORM – default blank state so the form always has controlled fields
 * Match these keys to the CustomerRequest fields from the API docs.
 */
const EMPTY_FORM = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    openingBalance: '',
};

/**
 * CustomerForm – handles both Create and Edit in one component
 *
 * Props:
 *   customer  {object|null} – if provided, the form pre-fills for editing;
 *                             if null, it's in "add" mode
 *   onSuccess {function}    – called with the saved customer after API responds OK
 *   onCancel  {function}    – called when user clicks Cancel
 */
export default function CustomerForm({ customer, onSuccess, onCancel }) {
    // Pre-fill form when editing; start blank when adding
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const isEditing = !!customer;

    // When the `customer` prop changes (user opens edit for a different row),
    // reset the form with fresh values.
    useEffect(() => {
        if (customer) {
            setForm({
                name: customer.name ?? '',
                phone: customer.phone ?? '',
                email: customer.email ?? '',
                address: customer.address ?? '',
                city: customer.city ?? '',
                state: customer.state ?? '',
                openingBalance: customer.openingBalance ?? '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setErrors({});
        setApiError('');
    }, [customer]);

    // ── Field change handler ─────────────────────────────────────────────────
    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear the specific field error as the user types
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // ── Client-side validation ───────────────────────────────────────────────
    function validate() {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Customer name is required.';
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }
        return newErrors;
    }

    // ── Form submit ──────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        setApiError('');

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Build the payload – omit empty optional fields to keep request clean
        const payload = {
            name: form.name.trim(),
            ...(form.phone && { phone: form.phone }),
            ...(form.email && { email: form.email }),
            ...(form.address && { address: form.address }),
            ...(form.city && { city: form.city }),
            ...(form.state && { state: form.state }),
            ...(form.openingBalance && { openingBalance: Number(form.openingBalance) }),
        };

        setSubmitting(true);
        try {
            let saved;
            if (isEditing) {
                saved = await customerService.update(customer.id, payload);
            } else {
                saved = await customerService.create(payload);
            }
            onSuccess(saved ?? payload); // fallback to payload if API returns nothing
        } catch (err) {
            setApiError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            {/* API-level error */}
            {apiError && (
                <Alert
                    variant="error"
                    message={apiError}
                    onClose={() => setApiError('')}
                    className="mb-5"
                />
            )}

            {/* ── Fields grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name – required */}
                <div className="sm:col-span-2">
                    <Input
                        label="Full Name *"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Acme Corp"
                        error={errors.name}
                        disabled={submitting}
                        autoFocus
                    />
                </div>

                <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    disabled={submitting}
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="customer@email.com"
                    error={errors.email}
                    disabled={submitting}
                />

                <Input
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                    disabled={submitting}
                />

                <Input
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="e.g. Maharashtra"
                    disabled={submitting}
                />

                <div className="sm:col-span-2">
                    <Input
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Street address"
                        disabled={submitting}
                    />
                </div>

                <Input
                    label="Opening Balance (₹)"
                    name="openingBalance"
                    type="number"
                    min="0"
                    value={form.openingBalance}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={submitting}
                />
            </div>

            {/* ── Footer actions ────────────────────────────────────────────── */}
            <div className="mt-6 flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        isEditing ? 'Update Customer' : 'Create Customer'
                    )}
                </Button>
            </div>
        </form>
    );
}
