import React, { useState, useEffect, useCallback } from 'react';
import {
    UserPlus,
    Pencil,
    Trash2,
    RefreshCw,
    Users,
    Search,
} from 'lucide-react';
import customerService from '../services/customerService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import CustomerForm from '../components/CustomerForm';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import { cn } from '../utils/cn';

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100" />
            ))}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Users className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No customers yet</h3>
            <p className="mt-1 text-sm text-slate-500">
                Add your first customer to get started.
            </p>
            <Button className="mt-5 gap-2" onClick={onAdd}>
                <UserPlus className="h-4 w-4" />
                Add Customer
            </Button>
        </div>
    );
}

// ─── Avatar initials ─────────────────────────────────────────────────────────
// Shows the first two letters of the customer name as a colour-coded avatar.
const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
];

function Avatar({ name }) {
    const initials = (name ?? '?')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    // Pick a colour based on the first character's char code for consistency
    const color = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

    return (
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', color)}>
            {initials}
        </div>
    );
}

// ─── Delete Confirm Dialog content ───────────────────────────────────────────
function DeleteConfirm({ customer, onConfirm, onCancel, deleting }) {
    return (
        <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-900">{customer?.name}</span>?
                This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={onCancel} disabled={deleting}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * Customers page
 *
 * UI state machine:
 *   - modal: null | 'add' | 'edit' | 'delete'
 *   - selectedCustomer: the customer row the user acted on
 *   - feedback: { variant, message } for success/error toasts at top of page
 */
export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Which modal is open
    const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete'
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Top-of-page feedback after a successful action
    const [feedback, setFeedback] = useState(null); // { variant, message }

    // Client-side search filter
    const [search, setSearch] = useState('');

    // ── Load customers ───────────────────────────────────────────────────────
    const loadCustomers = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await customerService.getAll();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err) {
            setLoadError(err.message ?? 'Failed to load customers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);

    // ── Feedback auto-dismiss after 4 seconds ────────────────────────────────
    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [feedback]);

    // ── Modal helpers ────────────────────────────────────────────────────────
    function openAdd() {
        setSelectedCustomer(null);
        setModal('add');
    }

    function openEdit(customer) {
        setSelectedCustomer(customer);
        setModal('edit');
    }

    function openDelete(customer) {
        setSelectedCustomer(customer);
        setModal('delete');
    }

    function closeModal() {
        setModal(null);
        setSelectedCustomer(null);
    }

    // ── Handle form success (add or edit) ────────────────────────────────────
    function handleFormSuccess(savedCustomer) {
        closeModal();
        setFeedback({
            variant: 'success',
            message: modal === 'edit'
                ? `"${savedCustomer.name}" updated successfully.`
                : `"${savedCustomer.name}" added successfully.`,
        });
        // Refresh list to reflect server state
        loadCustomers();
    }

    // ── Handle delete confirm ────────────────────────────────────────────────
    async function handleDeleteConfirm() {
        if (!selectedCustomer) return;
        setDeleting(true);
        try {
            await customerService.delete(selectedCustomer.id);
            setFeedback({
                variant: 'success',
                message: `"${selectedCustomer.name}" deleted successfully.`,
            });
            closeModal();
            loadCustomers();
        } catch (err) {
            setFeedback({ variant: 'error', message: err.message ?? 'Delete failed.' });
            closeModal();
        } finally {
            setDeleting(false);
        }
    }

    // ── Client-side search filter ────────────────────────────────────────────
    const filteredCustomers = customers.filter((c) => {
        const q = search.toLowerCase();
        return (
            (c.name ?? '').toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q) ||
            (c.phone ?? '').toLowerCase().includes(q) ||
            (c.city ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <MainLayout title="Customers">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                    <p className="text-sm text-slate-500">
                        Manage all your customers in one place.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadCustomers}
                        disabled={loading}
                        className="gap-2"
                        title="Refresh"
                    >
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button onClick={openAdd} className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* ── Top-of-page feedback ─────────────────────────────────────── */}
            {feedback && (
                <Alert
                    variant={feedback.variant}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                    className="mb-5"
                />
            )}

            {/* ── Load error ───────────────────────────────────────────────── */}
            {loadError && (
                <Alert
                    variant="error"
                    message={loadError}
                    onClose={loadCustomers}
                    className="mb-5"
                />
            )}

            {/* ── Main card ────────────────────────────────────────────────── */}
            <Card>
                {/* Card header + search bar */}
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>All Customers</CardTitle>
                        <CardDescription>
                            {loading ? 'Loading...' : `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}
                        </CardDescription>
                    </div>

                    {/* Search input */}
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </CardHeader>

                <CardContent>
                    {/* ── Loading skeleton ─────────────────────────────────── */}
                    {loading && <TableSkeleton />}

                    {/* ── Empty state ──────────────────────────────────────── */}
                    {!loading && !loadError && filteredCustomers.length === 0 && (
                        <EmptyState onAdd={openAdd} />
                    )}

                    {/* ── Table ────────────────────────────────────────────── */}
                    {!loading && filteredCustomers.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        {/* Name + avatar */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar name={customer.name} />
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {customer.name}
                                                    </p>
                                                    {customer.state && (
                                                        <p className="text-xs text-slate-400">
                                                            {customer.state}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {customer.phone || '—'}
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {customer.email || '—'}
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {customer.city || '—'}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(customer)}
                                                    title="Edit customer"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDelete(customer)}
                                                    title="Delete customer"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
            <Modal
                isOpen={modal === 'add' || modal === 'edit'}
                onClose={closeModal}
                title={modal === 'edit' ? 'Edit Customer' : 'Add New Customer'}
            >
                <CustomerForm
                    customer={modal === 'edit' ? selectedCustomer : null}
                    onSuccess={handleFormSuccess}
                    onCancel={closeModal}
                />
            </Modal>

            {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
            <Modal
                isOpen={modal === 'delete'}
                onClose={closeModal}
                title="Delete Customer"
                size="sm"
            >
                <DeleteConfirm
                    customer={selectedCustomer}
                    onConfirm={handleDeleteConfirm}
                    onCancel={closeModal}
                    deleting={deleting}
                />
            </Modal>
        </MainLayout>
    );
}
