import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import customerService from '../services/customerService';

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    openingBalance: z.string().optional().or(z.literal('')),
    loyaltyPoints: z.number().optional()
});

const EMPTY_FORM = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    openingBalance: '',
    loyaltyPoints: 0,
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
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const isEditing = !!customer;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(customerSchema),
        defaultValues: EMPTY_FORM,
        mode: 'onChange'
    });

    useEffect(() => {
        if (customer) {
            reset({
                name: customer.name ?? '',
                phone: customer.phone ?? '',
                email: customer.email ?? '',
                address: customer.address ?? '',
                city: customer.city ?? '',
                state: customer.state ?? '',
                openingBalance: customer.openingBalance ?? '',
                loyaltyPoints: customer.loyaltyPoints ?? 0,
            });
        } else {
            reset(EMPTY_FORM);
        }
        setApiError('');
    }, [customer, reset]);

    const onSubmit = async (data) => {
        setApiError('');
        setSubmitting(true);

        const payload = {
            ...data,
            name: data.name.trim(),
            openingBalance: data.openingBalance ? Number(data.openingBalance) : null,
            loyaltyPoints: Number(data.loyaltyPoints),
        };

        try {
            let saved;
            if (isEditing) {
                saved = await customerService.update(customer.id, payload);
            } else {
                saved = await customerService.create(payload);
            }
            onSuccess(saved ?? payload);
        } catch (err) {
            setApiError(err.message ?? 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                        {...register('name')}
                        placeholder="e.g. Acme Corp"
                        className={errors.name ? 'border-rose-500' : ''}
                        disabled={submitting}
                        autoFocus
                    />
                    {errors.name && <p className="text-rose-500 text-[10px] font-bold mt-0.5 ml-1">{errors.name.message}</p>}
                </div>

                <div>
                    <Input
                        label="Phone"
                        type="tel"
                        {...register('phone')}
                        maxLength={10}
                        placeholder="+91 98765 43210"
                        className={errors.phone ? 'border-rose-500' : ''}
                        disabled={submitting}
                    />
                    {errors.phone && <p className="text-rose-500 text-[10px] font-bold mt-0.5 ml-1">{errors.phone.message}</p>}
                </div>

                <div>
                    <Input
                        label="Email"
                        type="email"
                        {...register('email')}
                        placeholder="customer@email.com"
                        className={errors.email ? 'border-rose-500' : ''}
                        disabled={submitting}
                    />
                    {errors.email && <p className="text-rose-500 text-[10px] font-bold mt-0.5 ml-1">{errors.email.message}</p>}
                </div>

                <Input
                    label="City"
                    {...register('city')}
                    placeholder="e.g. Mumbai"
                    disabled={submitting}
                />

                <Input
                    label="State"
                    {...register('state')}
                    placeholder="e.g. Maharashtra"
                    disabled={submitting}
                />

                <div className="sm:col-span-2">
                    <Input
                        label="Address"
                        {...register('address')}
                        placeholder="Street address"
                        disabled={submitting}
                    />
                </div>

                <Input
                    label="Opening Balance (₹)"
                    type="number"
                    min="0"
                    {...register('openingBalance')}
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
