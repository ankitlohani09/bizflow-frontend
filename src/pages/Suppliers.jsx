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
import { cn } from '../utils/cn';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

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

    return (
        <MainLayout title="Vendors & Suppliers">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers</h1>
                    <p className="text-sm text-slate-500">Manage your business vendor relationships and tax information.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchSuppliers} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button className="gap-2 bg-slate-900 hover:bg-black text-white" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Add Vendor
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <Card className="shadow-xl shadow-slate-200/50 border-none overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Vendor Directory</CardTitle>
                            <CardDescription>
                                {filteredSuppliers.length} suppliers currently active.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, contact..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead>Email / Phone</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Tax ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSuppliers.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Building2 size={20} />
                                                </div>
                                                <span className="font-bold text-slate-900">{s.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-600">
                                            {s.contactPerson || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-slate-500 gap-1">
                                                <div className="flex items-center gap-1.5"><Mail size={12} /> {s.email || '—'}</div>
                                                <div className="flex items-center gap-1.5"><Phone size={12} /> {s.phone || '—'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <MapPin size={12} /> {s.city || '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {s.taxId || 'UNREGISTERED'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
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
