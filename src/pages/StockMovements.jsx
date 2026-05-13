import React, { useState, useEffect, useCallback } from 'react';
import { 
    History, 
    ArrowLeft, 
    RefreshCw, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    AlertCircle,
    Search,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import { cn } from '../utils/cn';

/**
 * StockMovements – Detailed audit trail of all inventory changes
 */
export default function StockMovements() {
    const navigate = useNavigate();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMovement, setSelectedMovement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        (m.notes || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.movementType || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <MainLayout title="Inventory Logs">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="mb-2 -ml-2 gap-2 text-slate-500">
                        <ArrowLeft size={14} /> Back to Inventory
                    </Button>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Stock Movements</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Movement & Adjustment Records</p>
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
                                    {filteredMovements.length} Stock changes recorded
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
                                    <TableHead className="pl-8 py-4 text-[9px] font-black uppercase tracking-widest">Date & Time</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Item Name</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Action</TableHead>
                                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">Qty</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Notes</TableHead>
                                    <TableHead className="pr-8 text-right text-[9px] font-black uppercase tracking-widest">Options</TableHead>
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
                                                move.direction === 'IN' 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {move.direction === 'IN' ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                                {move.movementType}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-900 dark:text-white">
                                            {move.direction === 'IN' ? '+' : '-'}{move.quantity}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">
                                                &quot;{move.notes || '—'}&quot;
                                            </p>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black italic">
                                                Done by: {move.createdBy || 'SYSTEM'}
                                            </p>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    setSelectedMovement(move);
                                                    setIsModalOpen(true);
                                                }}
                                                className="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Stock Detail"
                maxWidth="max-w-md"
            >
                {selectedMovement && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                selectedMovement.direction === 'IN' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                                {selectedMovement.direction === 'IN' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Type</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                    Stock {selectedMovement.direction === 'IN' ? 'Added' : 'Removed'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Item Name</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {selectedMovement.itemName}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quantity</p>
                                <p className={cn(
                                    "text-sm font-black",
                                    selectedMovement.direction === 'IN' ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {selectedMovement.direction === 'IN' ? '+' : '-'}{selectedMovement.quantity}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500">Date & Time</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                    {new Date(selectedMovement.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500">Done By</span>
                                <span className="text-xs font-black text-indigo-600">
                                    {selectedMovement.createdBy || 'System Admin'}
                                </span>
                            </div>
                            {selectedMovement.batchNo && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-500">Batch No</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        {selectedMovement.batchNo}
                                    </span>
                                </div>
                            )}
                            {selectedMovement.referenceType && (
                                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-500">Ref Type</span>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {selectedMovement.referenceType}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Notes</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">
                                &quot;{selectedMovement.notes || 'No notes added for this change.'}&quot;
                            </p>
                        </div>

                        <Button 
                            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Close Details
                        </Button>
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
}
