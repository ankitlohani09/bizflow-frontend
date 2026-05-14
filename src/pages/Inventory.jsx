import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    Plus,
    RefreshCw,
    Search,
    TrendingUp,
    ShieldAlert,
    AlertTriangle,
    ArrowRightLeft,
    MoreVertical,
    History,
    FileDown,
    Layers,
    Warehouse,
    Upload,
    Eye
} from 'lucide-react';
import inventoryService from '../services/inventoryService';
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
import StockMovementModal from '../components/StockMovementModal';
import ImportModal from '../components/ImportModal';
import ItemModal from '../components/ItemModal';
import { cn } from '../utils/cn';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import { TableSkeleton } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';

function StockBadge({ qty, threshold = 5 }) {
    if (qty <= 0) return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50">
            Out of Stock
        </span>
    );
    if (qty <= threshold) return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
            Low Stock
        </span>
    );
    return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
            In Stock
        </span>
    );
}

export default function Inventory() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'itemName', direction: 'asc' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryService.getAll();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load inventory.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const handleExport = () => {
        const exportData = flattenData(filteredRecords);
        exportToCSV(exportData, 'inventory-report');
    };

    const sortedRecords = [...records].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredRecords = sortedRecords.filter(r =>
        (r.name ?? r.itemName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.barcode ?? r.sku ?? r.itemId ?? '').toString().toLowerCase().includes(search.toLowerCase())
    );

    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const metrics = {
        totalItems: records.length,
        available: records.reduce((acc, r) => acc + (Number(r.availableQty) || 0), 0),
        lowStock: records.filter(r => (Number(r.availableQty) || 0) <= (Number(r.lowStockThreshold) || 5) && Number(r.availableQty) > 0).length,
        totalValue: records.reduce((acc, r) => acc + ((Number(r.availableQty) || 0) * (Number(r.costPrice) || 0)), 0),
        outOfStock: records.filter(r => (Number(r.availableQty) || 0) <= 0).length,
    };

    return (
        <MainLayout title="Logistics Center">
            {/* ── Elite Header ────────────────────────────────────────────────── */}
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between no-print">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-none">Inventory</h1>
                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Stock Management
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                        <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 text-[14px] font-bold text-slate-500" onClick={handleExport}>
                            <FileDown size={14} /> Export
                        </Button>
                        <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-1" />
                        <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 text-[14px] font-bold text-slate-500" onClick={() => setIsImportModalOpen(true)}>
                            <Upload size={14} /> Import
                        </Button>
                    </div>

                    <Button onClick={() => { setSelectedItem(null); setIsItemModalOpen(true); }} className="h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 px-8 rounded-2xl font-semibold uppercase tracking-widest text-[14px] gap-2 transition-all hover:scale-[1.02] active:scale-95">
                        <Plus size={18} /> New Item
                    </Button>
                </div>
            </div>

            {/* ── Glassmorphic Metrics ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                <StatusCard
                    title="Total Items"
                    value={metrics.totalItems}
                    icon={Package}
                    colorClass="from-blue-500 to-blue-600"
                    subtitle="Unique SKUs"
                />
                <StatusCard
                    title="Available Stock"
                    value={metrics.available}
                    icon={Layers}
                    colorClass="from-indigo-500 to-indigo-600"
                    subtitle="Ready to Sell"
                />
                <StatusCard
                    title="Stock Value"
                    value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(metrics.totalValue)}
                    icon={TrendingUp}
                    colorClass="from-emerald-500 to-emerald-600"
                    subtitle="Total Valuation"
                />
                <StatusCard
                    title="Low Stock"
                    value={metrics.lowStock}
                    icon={ShieldAlert}
                    colorClass={metrics.lowStock > 0 ? "from-rose-500 to-rose-600" : "from-slate-400 to-slate-500"}
                    subtitle="Needs Refill"
                />
            </div>

            {error && <Alert variant="error" message={error} className="mb-8 border-none bg-rose-50/50 backdrop-blur-md" onClose={() => setError(null)} />}

            {/* ── Main Availability Table ────────────────────────────────────── */}
            <Card className="enterprise-card overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight border-none p-0">Stock Availability</CardTitle>
                            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Inventory Levels</p>
                        </div>

                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, SKU or barcode..."
                                className="w-full h-14 rounded-2xl border-none bg-slate-50 dark:bg-slate-800/50 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
                        <div className="p-10"><TableSkeleton rows={8} /></div>
                    ) : (
                        <Table className="border-separate border-spacing-0">
                            <TableHeader>
                                <TableRow className="bg-slate-50/30 dark:bg-slate-800/30 hover:bg-transparent border-none">
                                    <TableHead className="pl-10 py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400 cursor-pointer" onClick={() => handleSort('itemName')}>Product Name</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400">SKU / Batch</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400">Expiry</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400">Category</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400 text-center cursor-pointer" onClick={() => handleSort('availableQty')}>Available</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400 text-right">Price</TableHead>
                                    <TableHead className="py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400">Status</TableHead>
                                    <TableHead className="pr-10 py-5 text-[15px] font-semibold uppercase tracking-widest text-slate-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-24 text-center">
                                            <p className="text-[15px] font-semibold text-slate-300 uppercase tracking-[0.3em]">No Assets Found in Matrix</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedRecords.map((r) => (
                                    <TableRow key={r.id ?? r.itemId} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-none transition-colors">
                                        <TableCell className="pl-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 transition-transform">
                                                    <Package size={20} />
                                                </div>
                                                <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                                                    {r.itemName || r.name || 'UNNAMED'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-semibold text-slate-900 dark:text-white uppercase tracking-widest font-mono leading-none">
                                                    {r.sku || r.barcode || r.itemId || '—'}
                                                </span>
                                                {r.batchNo && (
                                                    <span className="text-[15px] font-semibold text-slate-400 uppercase tracking-tighter mt-1">
                                                        Batch: {r.batchNo}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "text-[15px] font-semibold uppercase tracking-widest",
                                                r.expiryDate && new Date(r.expiryDate) < new Date() ? "text-rose-500" : "text-slate-400"
                                            )}>
                                                {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[15px] font-bold text-slate-500">
                                                {r.categoryName || r.category?.name || r.category || '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                                                    {Number(r.availableQty ?? 0).toLocaleString()}
                                                </span>
                                                <span className="text-[15px] font-semibold text-emerald-500 uppercase tracking-widest">Sellable</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.sellingPrice || 0)}
                                                </span>
                                                <span className="text-[15px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">Unit Rate</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StockBadge qty={Number(r.availableQty ?? 0)} threshold={r.lowStockThreshold} />
                                        </TableCell>
                                        <TableCell className="pr-10 text-right">
                                            <div className="flex justify-end gap-2 transition-all">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-indigo-600 hover:text-white shadow-sm" onClick={() => navigate(`/inventory/${r.id}`)}>
                                                    <Eye size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-600 hover:text-white shadow-sm" onClick={() => { setSelectedItem(r); setIsModalOpen(true); }}>
                                                    <ArrowRightLeft size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-900 hover:text-white shadow-sm" onClick={() => { setSelectedItem(r); setIsItemModalOpen(true); }}>
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>

                {!loading && filteredRecords.length > 0 && (
                    <div className="p-10 border-t border-slate-50 dark:border-slate-800">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredRecords.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </Card>

            <StockMovementModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                onSuccess={fetchData}
                initialItem={selectedItem}
            />

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchData} />
            <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSuccess={fetchData} initialData={selectedItem} />
        </MainLayout>
    );
}

function StatusCard({ title, value, icon: Icon, colorClass, subtitle }) {
    return (
        <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-100/50 dark:shadow-none p-8 rounded-[2rem] group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
            <div className={cn("absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform bg-gradient-to-br", colorClass)} />
            <div className="flex items-center gap-6 relative z-10">
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br", colorClass)}>
                    <Icon size={32} />
                </div>
                <div>
                    <p className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white leading-none mb-2 tracking-tighter tabular-nums">{value}</p>
                    <p className="text-[14px] font-bold text-slate-400 dark:text-slate-500 tracking-tight flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                        {subtitle}
                    </p>
                </div>
            </div>
        </Card>
    );
}
