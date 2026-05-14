import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2,
    Plus,
    RefreshCw,
    Search,
    User,
    Phone,
    Mail,
    MapPin,
    MoreVertical,
    FileText,
} from 'lucide-react';
import supplierService from '../services/supplierService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import SupplierModal from '../components/SupplierModal';
import Pagination from '../components/ui/Pagination';
import { cn } from '../utils/cn';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, data: null });

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await supplierService.getAll();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load suppliers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    const filteredSuppliers = suppliers.filter(s =>
        (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.contactPerson ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(search.toLowerCase())
    );

    // Paginated results
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <MainLayout title="Suppliers">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Suppliers</h1>
                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Vendor Management
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchSuppliers} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold px-6 rounded-xl" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Add Supplier
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <Card className="enterprise-card overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-slate-900 border-none font-bold">Vendor Directory</CardTitle>
                            <CardDescription className="text-slate-500 font-medium capitalize">
                                {filteredSuppliers.length} active suppliers identified in network.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, contact..."
                                className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-shadow"
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
                        <div className="p-6 space-y-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-50 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <Building2 size={48} className="mb-4" />
                            <p className="font-semibold text-lg">No suppliers found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                    <TableHead className="pl-8 py-4 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Company</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Contact Person</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Email / Phone</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Location</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Tax ID</TableHead>
                                    <TableHead className="text-right pr-8 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedSuppliers.map((s) => (
                                    <TableRow key={s.id} className="group border-slate-50 dark:border-slate-800">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Building2 size={20} />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{s.name || 'Unknown Vendor'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                                            {s.contactPerson || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-[14px] text-slate-500 gap-1">
                                                <div className="flex items-center gap-1.5 font-bold tracking-tight"><Mail size={12} className="text-blue-500" /> {s.email || '—'}</div>
                                                <div className="flex items-center gap-1.5 font-bold tracking-tight"><Phone size={12} className="text-emerald-500" /> {s.phone || '—'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-[14px] text-slate-500 font-bold tracking-tight">
                                                <MapPin size={12} className="text-rose-500/70" /> {s.city || '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[14px] font-semibold text-slate-400 uppercase tracking-widest">
                                            {s.taxId || 'UNREGISTERED'}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                                                    onClick={() => setModal({ isOpen: true, data: s })}
                                                >
                                                    <MoreVertical size={16} className="text-slate-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {!loading && filteredSuppliers.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredSuppliers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <SupplierModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchSuppliers}
                supplier={modal.data}
            />
        </MainLayout>
    );
}
