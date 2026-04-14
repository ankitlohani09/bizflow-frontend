import React, { useState, useEffect, useCallback } from 'react';
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
    Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { cn } from '../utils/cn';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import { TableSkeleton } from '../components/ui/Skeleton';

function StockBadge({ qty, threshold = 5 }) {
    if (qty <= 0) return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 border border-rose-100">
            Out of Stock
        </span>
    );
    if (qty <= threshold) return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 border border-amber-100">
            Low Stock
        </span>
    );
    return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-100">
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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryService.getAll();
            setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load inventory.');
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
        (r.itemName ?? r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.sku ?? r.itemId ?? '').toString().toLowerCase().includes(search.toLowerCase())
    );

    const metrics = {
        totalItems: records.length,
        available: records.reduce((acc, r) => acc + (r.availableQty || 0), 0),
        lowStock: records.filter(r => r.availableQty <= (r.lowStockThreshold || 5)).length,
        reserved: records.reduce((acc, r) => acc + (r.reservedQty || 0), 0),
        damaged: records.reduce((acc, r) => acc + (r.damagedQty || 0), 0),
        expired: records.reduce((acc, r) => acc + (r.expiredQty || 0), 0),
    };

    return (
        <MainLayout title="Logistics Center">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Monitor real-time availability and warehouse movements.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" onClick={handleExport}>
                        <FileDown className="h-4 w-4" /> Export Ledger
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="h-4 w-4" /> Bulk Import
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" onClick={() => navigate('/stock-movements')}>
                        <History className="h-4 w-4" /> Audit Logs
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Plus size={16} /> Adjustment
                    </Button>
                </div>
            </div>

            {/* ── Status Cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
                <StatusCard
                    title="Available Pool"
                    value={metrics.available}
                    icon={Warehouse}
                    colorClass="icon-box-blue"
                    subtitle="Sellable assets"
                />
                <StatusCard
                    title="Reserved"
                    value={metrics.reserved}
                    icon={Layers}
                    colorClass="icon-box-indigo"
                    subtitle="Pending fulfillment"
                />
                <StatusCard
                    title="Damaged"
                    value={metrics.damaged}
                    icon={ShieldAlert}
                    colorClass="icon-box-amber"
                    subtitle="Loss/Damage log"
                />
                <StatusCard
                    title="Expired"
                    value={metrics.expired}
                    icon={AlertTriangle}
                    colorClass="icon-box-rose"
                    subtitle="Critical depletion"
                />
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Main List ───────────────────────────────────────────────────── */}
            <Card className="enterprise-card overflow-hidden mb-12">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="tracking-tighter font-bold text-slate-900 border-none">Availability Matrix</CardTitle>
                            <CardDescription>
                                Real-time stock levels across all categories.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by SKU or Item Name..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8"><TableSkeleton rows={6} /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                    <TableHead className="pl-8 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('itemName')}>Item / Classification</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white text-center" onClick={() => handleSort('availableQty')}>Sellable</TableHead>
                                    <TableHead className="text-center">Reserved</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead>Network Status</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.map((r) => (
                                    <TableRow key={r.id} className="group dark:border-slate-800 dark:hover:bg-slate-800/40">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <Layers size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter leading-none">{r.itemName || r.name || 'UNNAMED_ASSET'}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 font-mono">
                                                        SKU: {r.sku || r.itemId || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-slate-700 dark:text-white tabular-nums">{r.availableQty}</span>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">Ready</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-slate-400 dark:text-slate-500 tabular-nums">{r.reservedQty || 0}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1 font-mono">Hold</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.price || r.unitPrice || 0)}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Base Rate</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StockBadge qty={r.availableQty} threshold={r.lowStockThreshold} />
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                    onClick={() => { setSelectedItem(r); setIsModalOpen(true); }}
                                                >
                                                    <ArrowRightLeft size={14} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreVertical size={14} className="text-slate-400" />
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

            <StockMovementModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
                onSuccess={fetchData}
                initialItem={selectedItem}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchData}
            />
        </MainLayout>
    );
}

function StatusCard({ title, value, icon: Icon, colorClass, subtitle }) {
    return (
        <Card className="enterprise-card h-full p-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-6">
                <div className={cn("p-4 rounded-2xl shrink-0 transition-transform", colorClass)}>
                    <Icon size={28} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">{subtitle}</p>
                </div>
            </div>
        </Card>
    );
}
