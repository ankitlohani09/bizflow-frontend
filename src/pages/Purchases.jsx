import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart,
    Plus,
    RefreshCw,
    Search,
    Calendar,
    ArrowDownCircle,
    Building2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../services/purchaseService';
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
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

function PurchaseStatusBadge({ status }) {
    const s = (status || '').toUpperCase();
    if (s === 'RECEIVED') return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-widest">
            <CheckCircle2 size={12} /> Received
        </span>
    );
    if (s === 'PAID') return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 uppercase tracking-widest">
            <CheckCircle2 size={12} /> Paid
        </span>
    );
    if (s === 'PENDING') return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100 uppercase tracking-widest">
            <Clock size={12} /> Pending
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-100 uppercase tracking-widest">
            <AlertCircle size={12} /> Unknown
        </span>
    );
}

export default function Purchases() {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await purchaseService.getAll();
            setPurchases(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load purchase history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredPurchases = purchases.filter(p =>
        (p.supplierName || p.supplier?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.id || '').toString().toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout title="Procurement History">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Logs</h1>
                    <p className="text-sm text-slate-500">Track company inventory buy-ins and supply chain costs.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/suppliers')}>
                        <Building2 className="h-4 w-4" /> Vendors
                    </Button>
                    <Button className="gap-2 bg-slate-900 hover:bg-black text-white" onClick={() => navigate('/purchases/new')}>
                        <Plus className="h-4 w-4" /> New Purchase
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Main List ───────────────────────────────────────────────────── */}
            <Card className="shadow-xl border-none ring-1 ring-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowDownCircle size={20} className="text-emerald-500" /> Procurement History
                            </CardTitle>
                            <CardDescription>
                                {filteredPurchases.length} records found.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search vendor or PO #..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-4 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-50 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <ShoppingCart size={48} className="mb-4" />
                            <p className="font-semibold text-lg">No purchases recorded</p>
                            <p className="text-sm">Start by adding a new stock replenishment order.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableHead>PO Number</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPurchases.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <span className="font-bold text-slate-400 font-mono text-xs">#PO-{p.id}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                                                    <Building2 size={14} />
                                                </div>
                                                <span className="font-bold text-slate-900">{p.supplierName || p.supplier?.name || `Supplier #${p.supplierId}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <PurchaseStatusBadge status={p.status} />
                                        </TableCell>
                                        <TableCell className="text-right font-black text-slate-900">
                                            {fmt(p.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Eye size={16} className="text-slate-400 hover:text-blue-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </MainLayout>
    );
}
