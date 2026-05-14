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
import { formatDateOnly } from '../utils/formatDate';
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
import Pagination from '../components/ui/Pagination';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

function PurchaseStatusBadge({ status }) {
    const s = (status || '').toUpperCase();
    const styles = {
        RECEIVED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        PAID: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider',
            styles[s] ?? 'bg-rose-50 text-rose-700 border-rose-100'
        )}>
            {status || 'Unknown'}
        </span>
    );
}

export default function Purchases() {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    // Paginated results
    const paginatedPurchases = filteredPurchases.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <MainLayout title="Purchases">
                        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <ShoppingCart size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Purchases</h1>
                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Track company inventory buy-ins and supply chain costs.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-200 font-bold" onClick={() => navigate('/suppliers')}>
                        <Building2 className="h-4 w-4" /> Suppliers
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold px-6 rounded-xl" onClick={() => navigate('/purchases/new')}>
                        <Plus className="h-4 w-4" /> New Purchase
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Main List ───────────────────────────────────────────────────── */}
            <Card className="enterprise-card overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-slate-900 border-none font-bold">Purchase Records</CardTitle>
                            <CardDescription className="text-slate-500 font-medium capitalize">
                                {filteredPurchases.length} stock purchases in your ledger.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search vendor or PO #..."
                                className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
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
                                <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                    <TableHead className="pl-8 py-4 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Order ID</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Vendor</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Timeline</TableHead>
                                    <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                                    <TableHead className="text-right text-[14px] font-semibold uppercase tracking-wider text-slate-500">Net Cost</TableHead>
                                    <TableHead className="text-right pr-8 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPurchases.map((p) => (
                                    <TableRow key={p.id} className="group border-slate-50 dark:border-slate-800 cursor-pointer" onClick={() => navigate(`/purchases/${p.id}`)}>
                                        <TableCell className="pl-8 py-6">
                                            <span className="font-bold text-slate-400 font-mono text-[14px] uppercase tracking-tighter">#PO-{p.id}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{p.supplierName || p.supplier?.name || `Supplier #${p.supplierId}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-bold text-[14px] uppercase tracking-widest whitespace-nowrap">
                                            {formatDateOnly(p.purchaseDate || p.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <PurchaseStatusBadge status={p.status} />
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-slate-900 dark:text-white text-lg tabular-nums">
                                            {fmt(p.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); navigate(`/purchases/${p.id}`); }}>
                                                    <Eye size={16} className="text-slate-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {!loading && filteredPurchases.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredPurchases.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>
        </MainLayout>
    );
}
