import React, { useState, useEffect, useCallback } from 'react';
import {
    Package,
    Plus,
    RefreshCw,
    Search,
    AlertTriangle,
    ArrowRightLeft,
    History,
    MoreVertical,
    TrendingUp,
    ShieldAlert,
    Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import StockMovementModal from '../components/StockMovementModal';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '../components/ui/Table';
import { cn } from '../utils/cn';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StockBadge({ qty, threshold }) {
    const isLow = qty <= (threshold ?? 5);
    const isOut = qty <= 0;

    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold leading-none border',
            isOut
                ? 'bg-rose-50 text-rose-700 border-rose-100'
                : isLow
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        )}>
            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
        </span>
    );
}

function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-50" />
            ))}
        </div>
    );
}

// ─── Inventory Page ───────────────────────────────────────────────────────────

export default function Inventory() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    // ── Metrics ───────────────────────────────────────────────────────────────
    const metrics = {
        totalItems: records.length,
        lowStock: records.filter(r => r.availableQty <= (r.lowStockThreshold || 5)).length,
        outOfStock: records.filter(r => r.availableQty <= 0).length,
    };

    const filteredRecords = records.filter(r =>
        (r.itemName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (r.sku ?? r.itemId ?? '').toString().toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout title="Inventory">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Control</h1>
                    <p className="text-sm text-slate-500">Monitor stock levels and manage item availability.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/inventory/history')}>
                        <History className="h-4 w-4" /> History
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}>
                        <Plus className="h-4 w-4" /> New Movement
                    </Button>
                </div>
            </div>

            {/* ── Status Cards ────────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</p>
                            <p className="text-2xl font-black text-slate-900">{metrics.totalItems}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock</p>
                            <p className="text-2xl font-black text-slate-900">{metrics.lowStock}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Out of Stock</p>
                            <p className="text-2xl font-black text-slate-900">{metrics.outOfStock}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Main List ───────────────────────────────────────────────────── */}
            <Card className="shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Catalog & Availability</CardTitle>
                            <CardDescription>
                                {filteredRecords.length} items found in your catalog.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6"><TableSkeleton /></div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <TrendingUp size={48} className="mb-4" />
                            <p className="font-semibold text-lg">No inventory records</p>
                            <p className="text-sm">Start by adding products or stock movements.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/10 hover:bg-transparent">
                                    <TableHead>Item / SKU</TableHead>
                                    <TableHead>Qty Available</TableHead>
                                    <TableHead>Damaged/Expired</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Min. Level</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{r.itemName || 'Unnamed Item'}</span>
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                                    SKU: {r.sku || r.itemId || '—'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-black text-slate-700">{r.availableQty}</span>
                                                <span className="text-xs text-slate-400">units</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs space-y-0.5">
                                                <span className="text-rose-600/70 font-medium">Damaged: {r.damagedQty || 0}</span>
                                                <span className="text-orange-600/70 font-medium">Expired: {r.expiredQty || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StockBadge qty={r.availableQty} threshold={r.lowStockThreshold} />
                                        </TableCell>
                                        <TableCell className="text-slate-500 font-medium italic">
                                            {r.lowStockThreshold || 5} units
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    title="Stock Adjustment"
                                                    onClick={() => { setSelectedItem(r); setIsModalOpen(true); }}
                                                >
                                                    <ArrowRightLeft size={16} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Settings">
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

            <StockMovementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                initialItem={selectedItem}
            />
        </MainLayout>
    );
}
