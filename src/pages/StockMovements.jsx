import React, { useState, useEffect, useCallback } from 'react';
import { 
    History, 
    ArrowLeft, 
    RefreshCw, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    AlertCircle,
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';

/**
 * StockMovements – Detailed audit trail of all inventory changes
 */
export default function StockMovements() {
    const navigate = useNavigate();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await inventoryService.getStockMovements();
            setMovements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err.message ?? 'Failed to retrieve audit trail.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredMovements = movements.filter(m => 
        (m.itemName || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.reason || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.type || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout title="Inventory Audit Logs">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="mb-2 -ml-2 gap-2 text-slate-500">
                        <ArrowLeft size={14} /> Back to Logistics
                    </Button>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Audit Trail</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Movement & Adjustment Ledger</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 dark:border-slate-800" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                </div>
            </div>

            <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
                                <History size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-500">System Events</CardTitle>
                                <CardDescription className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {filteredMovements.length} logged movements
                                </CardDescription>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter events..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                         <div className="p-6"><TableSkeleton rows={8} /></div>
                    ) : filteredMovements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center opacity-30">
                            <AlertCircle size={48} className="mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest">No matching events found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-b-2 border-slate-900 dark:border-slate-800">
                                    <TableHead className="pl-8 py-4 text-[9px] font-black uppercase tracking-widest">Timestamp</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Item</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Type</TableHead>
                                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">Quantity</TableHead>
                                    <TableHead className="pr-8 text-[9px] font-black uppercase tracking-widest text-right">Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMovements.map((move, i) => (
                                    <TableRow key={i} className="dark:border-slate-800 dark:hover:bg-slate-800/40 group border-b border-slate-50">
                                        <TableCell className="pl-8 py-5">
                                            <p className="text-[10px] font-bold text-slate-900 dark:text-white">
                                                {new Date(move.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(move.createdAt).toLocaleTimeString()}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter text-sm">
                                                {move.itemName || 'Unknown Product'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">SKU: {move.sku || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                move.type === 'IN' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {move.type === 'IN' ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                                Stock {move.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-900 dark:text-white">
                                            {move.type === 'IN' ? '+' : '-'}{move.quantity}
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                                                "{move.reason || 'Manual Adjustment'}"
                                            </p>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black italic">
                                                Operator: {localStorage.getItem('tenantName') || 'SYSTEM'}
                                            </p>
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
