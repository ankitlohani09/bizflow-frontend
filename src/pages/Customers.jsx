import React, { useState, useEffect, useCallback } from 'react';
import { 
    UserPlus, 
    Pencil, 
    Trash2, 
    RefreshCw, 
    Search, 
    FileDown, 
    Mail, 
    Phone, 
    MapPin,
    AlertCircle,
    User,
    Star
} from 'lucide-react';
import customerService from '../services/customerService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
import CustomerForm from '../components/CustomerForm';
import { cn } from '../utils/cn';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import Pagination from '../components/ui/Pagination';

function Avatar({ name }) {
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-400 dark:text-slate-500 shadow-sm border border-slate-200 dark:border-slate-800">
            {name?.charAt(0).toUpperCase() || <User size={16} />}
        </div>
    );
}

function DeleteConfirm({ customer, onConfirm, onCancel, deleting }) {
    return (
        <div className="p-6">
            <div className="flex items-center gap-4 text-rose-600 mb-6">
                <AlertCircle size={32} className="opacity-20" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Delete Customer</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-8">
                Are you sure you want to delete <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{customer?.name}</span>? 
                This will remove all their data from the shop records.
            </p>
            <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onCancel} className="font-bold text-slate-400">Cancel</Button>
                <Button 
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest px-6 shadow-lg shadow-rose-500/20"
                    onClick={onConfirm}
                    disabled={deleting}
                >
                    {deleting ? 'Deleting...' : 'Delete Now'}
                </Button>
            </div>
        </div>
    );
}

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Which modal is open
    const [modal, setModal] = useState(null); 
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Top-of-page feedback
    const [feedback, setFeedback] = useState(null); 

    // Client-side search filter
    const [search, setSearch] = useState('');

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

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const data = flattenData(filteredCustomers);
        exportToCSV(data, 'customers-report');
    };

    const handleFormSuccess = () => {
        setModal(null);
        setFeedback({ variant: 'success', message: 'Customer details saved successfully.' });
        loadCustomers();
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await customerService.delete(selectedCustomer.id);
            setFeedback({ variant: 'success', message: 'Customer deleted successfully.' });
            loadCustomers();
        } catch (err) {
            setFeedback({ variant: 'error', message: err.message ?? 'Failed to delete customer.' });
        } finally {
            setDeleting(false);
            setModal(null);
        }
    };

    const sortedCustomers = [...customers].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredCustomers = sortedCustomers.filter((c) => {
        const q = search.toLowerCase();
        return (
            (c.name ?? '').toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q) ||
            (c.phone ?? '').toLowerCase().includes(q) ||
            (c.city ?? '').toLowerCase().includes(q)
        );
    });

    // Paginated results
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <MainLayout title="Customer List">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customers</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Keep track of your regular shop customers.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={loadCustomers} disabled={loading} className="dark:text-slate-400">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 dark:border-slate-800 dark:text-slate-300 font-bold" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> CSV Export
                    </Button>
                    <Button onClick={() => setModal('add')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest px-6 rounded-xl">
                        <UserPlus className="h-4 w-4" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {(feedback || loadError) && (
                <Alert 
                    variant={loadError ? 'error' : feedback.variant} 
                    message={loadError || feedback.message} 
                    onClose={() => { setFeedback(null); setLoadError(''); }} 
                    className="mb-6 shadow-lg" 
                />
            )}

            <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="dark:text-white tracking-tighter uppercase font-black text-slate-400 text-[14px] tracking-widest mb-1">Registered Clients</CardTitle>
                            <CardDescription className="dark:text-slate-400 font-medium capitalize text-lg text-slate-900 tracking-tighter">
                                {loading ? 'Querying database...' : `Managing ${filteredCustomers.length} active relations.`}
                            </CardDescription>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Name, Email, or Region..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6"><TableSkeleton rows={6} /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white pl-8 py-4 text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('name')}>Customer Name</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('phone')}>Phone No.</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest text-center" onClick={() => handleSort('loyaltyPoints')}>Points</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest" onClick={() => handleSort('city')}>City</TableHead>
                                    <TableHead className="text-right pr-8 text-[9px] font-black uppercase tracking-widest">Options</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="dark:border-slate-800 dark:hover:bg-slate-800/40 group">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar name={customer.name} />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter text-sm leading-none">{customer.name}</span>
                                                        {customer.loyaltyPoints > 500 && (
                                                            <span className="bg-amber-100 text-amber-700 text-[12px] px-1.5 py-0.5 rounded-full font-black uppercase ring-1 ring-amber-200 shadow-sm">VIP</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[14px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                                                        <Mail size={10} className="text-blue-500" /> {customer.email || 'NO_INTERNAL_MAIL'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[14px] font-bold text-slate-600 dark:text-slate-400">
                                                    <Phone size={12} className="text-emerald-500" /> {customer.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{customer.loyaltyPoints || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
                                                <MapPin size={12} className="text-rose-500" /> {customer.city || 'Global'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                    onClick={() => { setSelectedCustomer(customer); setModal('edit'); }}
                                                >
                                                    <Pencil size={14} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                    onClick={() => { setSelectedCustomer(customer); setModal('delete'); }}
                                                >
                                                    <Trash2 size={14} className="text-slate-400 hover:text-rose-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                
                {!loading && filteredCustomers.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredCustomers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Customer' : 'Add New Customer'} size="lg">
                <CustomerForm customer={modal === 'edit' ? selectedCustomer : null} onSuccess={handleFormSuccess} onCancel={() => setModal(null)} />
            </Modal>
            <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Customer" size="sm">
                <DeleteConfirm customer={selectedCustomer} onConfirm={handleDeleteConfirm} onCancel={() => setModal(null)} deleting={deleting} />
            </Modal>
        </MainLayout>
    );
}
