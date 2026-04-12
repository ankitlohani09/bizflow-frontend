import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    RefreshCw,
    History,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCw,
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
import { cn } from '../utils/cn';

function MovementBadge({ type }) {
    const t = (type || '').toUpperCase();
    if (t === 'IN') return (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
            <ArrowUpCircle size={14} /> Stock In
        </span>
    );
    if (t === 'OUT') return (
        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
            <ArrowDownCircle size={14} /> Stock Out
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs">
            <RotateCw size={14} /> Adjustment
        </span>
    );
}

export default function StockHistory() {
    const navigate = useNavigate();
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await inventoryService.getStockMovements();
            setMovements(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load movement logs.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <MainLayout title="Stock History">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="gap-2">
                    <ArrowLeft size={16} /> Back to Inventory
                </Button>
                <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Stock Movement Logs</h1>
                <p className="text-sm text-slate-500">Audit trail of all inventory additions and removals.</p>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            <Card className="shadow-lg border-slate-100">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <History size={16} /> Movement Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-4 p-6 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-50 rounded-lg" />
                            ))}
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <History size={48} className="mx-auto mb-4" />
                            <p className="font-medium">No movement history found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Reason / Reference</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-slate-500 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(m.createdAt || m.date).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {m.itemName || `#${m.itemId}`}
                                        </TableCell>
                                        <TableCell>
                                            <MovementBadge type={m.movementType} />
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-black",
                                            m.movementType === 'OUT' ? "text-rose-600" : "text-emerald-600"
                                        )}>
                                            {m.movementType === 'OUT' ? '-' : '+'}{m.quantity}
                                        </TableCell>
                                        <TableCell className="text-slate-500 italic max-w-xs truncate">
                                            {m.reason || '—'}
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
