import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Clock,
    History,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Box,
    Tag,
    Calendar,
    MapPin,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import inventoryService from '../services/inventoryService';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn } from '../utils/cn';
import { formatDateTime, formatDateOnly } from '../utils/formatDate';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function InventoryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inventory, setInventory] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const inv = await inventoryService.getById(id);
            setInventory(inv);
            
            if (inv && inv.itemId) {
                const movs = await inventoryService.getMovementsByItem(inv.itemId);
                setMovements(Array.isArray(movs) ? movs : []);
            }
        } catch (err) {
            setError(err.message ?? 'Failed to load inventory details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <MainLayout title="Loading Inventory...">
            <div className="flex flex-col items-center justify-center h-96 opacity-30">
                <Clock className="w-12 h-12 animate-spin mb-4" />
                <p className="font-semibold uppercase tracking-widest text-[14px]">Accessing Inventory Files</p>
            </div>
        </MainLayout>
    );

    if (error) return (
        <MainLayout title="Error">
            <div className="flex flex-col items-center justify-center h-96 text-rose-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-semibold uppercase tracking-widest text-[14px]">{error}</p>
                <Button variant="ghost" className="mt-6" onClick={() => navigate('/inventory')}>Back to Inventory</Button>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout title={`Inventory Details — ${inventory?.itemName || 'Item'}`}>
            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="gap-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                    onClick={() => navigate('/inventory')}
                >
                    <ArrowLeft size={16} /> Back to Inventory
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* ── Left Column: Item Info & Stock ────────────────── */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="enterprise-card overflow-hidden">
                        <div className="h-32 bg-slate-900 flex items-end px-8 pb-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Package size={120} className="text-blue-400" />
                            </div>
                            <div className="z-10 bg-white p-1 rounded-2xl shadow-xl -mb-12">
                                <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-slate-400 text-3xl">
                                    {inventory?.itemName?.charAt(0)}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                                {inventory?.itemName}
                            </h2>
                            <p className="text-blue-500 font-semibold uppercase tracking-widest text-[14px] mt-2">
                                SKU: {inventory?.sku || inventory?.barcode || 'N/A'}
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Tag size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Category: {inventory?.categoryName || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Box size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Batch: {inventory?.batchNo || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Expiry: {inventory?.expiryDate ? formatDateOnly(inventory.expiryDate) : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Location: {inventory?.location || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">MRP</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{fmt(inventory?.mrp)}</p>
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        <div className={cn("h-2 w-2 rounded-full", inventory?.availableQty > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                                        <span className={cn("text-[14px] font-semibold uppercase tracking-tighter", inventory?.availableQty > 0 ? "text-emerald-600" : "text-rose-400")}>
                                            {inventory?.availableQty > 0 ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Summary Card */}
                    <Card className="enterprise-card p-6 bg-slate-950 text-white border-none relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Box className="text-blue-400" size={20} />
                            </div>
                            <h3 className="font-semibold uppercase tracking-widest text-[14px] text-slate-400">Stock Levels</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Available</p>
                                    <p className="text-xl font-semibold text-emerald-500 mt-1">{inventory?.availableQty || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Reserved</p>
                                    <p className="text-xl font-semibold text-amber-400 mt-1">{inventory?.reservedQty || 0}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Damaged</p>
                                    <p className="text-xl font-semibold text-rose-400 mt-1">{inventory?.damagedQty || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Expired</p>
                                    <p className="text-xl font-semibold text-rose-400 mt-1">{inventory?.expiredQty || 0}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right Column: Movement History ────────────────── */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="enterprise-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-widest">
                                        <History size={20} className="text-blue-500" /> Stock Movements
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-[14px] mt-1 font-bold lowercase">History of stock IN and OUT transactions.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800 border-none hover:bg-transparent">
                                        <TableHead className="pl-8 py-4 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Type</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Quantity</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Reference</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500 pr-8 text-right">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center opacity-30 italic font-medium">No stock movements found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        movements.map((mov, i) => (
                                            <TableRow key={i} className="border-slate-50 dark:border-slate-800/20">
                                                <TableCell className="pl-8 font-semibold text-slate-900 dark:text-white">
                                                    {mov.createdAt ? formatDateTime(mov.createdAt) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[14px] font-semibold uppercase tracking-widest",
                                                        mov.direction === 'IN' ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {mov.direction === 'IN' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {mov.movementType}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-900 dark:text-white">
                                                    {mov.quantity}
                                                </TableCell>
                                                <TableCell className="text-slate-500 dark:text-slate-400 font-bold">
                                                    {mov.referenceType} #{mov.referenceId || '—'}
                                                </TableCell>
                                                <TableCell className="pr-8 text-right text-slate-400 text-[14px] font-bold">
                                                    {mov.notes || '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
