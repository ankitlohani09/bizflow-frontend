import React, { useState, useEffect } from 'react';
import { 
    RotateCcw, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Package,
    ArrowUpRight,
    Loader2,
    AlertCircle
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import returnService from '../services/returnService';
import { formatCurrency as fmt } from '../utils/formatCurrency';

export default function Returns() {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchReturns() {
            setLoading(true);
            try {
                const data = await returnService.getReturnHistory();
                setReturns(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to sync returns log.');
            } finally {
                setLoading(false);
            }
        }
        fetchReturns();
    }, []);

    const filteredReturns = returns.filter(r => 
        r.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.invoiceId).includes(searchTerm)
    );

    if (loading) {
        return (
            <MainLayout title="Auditing Returns...">
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Scanning Return Ledger...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Returns Log">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Returns Audit</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Track every refund and inventory restoration in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                            placeholder="Search by Invoice or Client..." 
                            className="pl-9 w-64 h-11 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-none ring-1 ring-slate-200 dark:ring-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <Card className="mb-8 border-none bg-rose-50 dark:bg-rose-500/10 p-4 flex items-center gap-3">
                    <AlertCircle className="text-rose-500" size={18} />
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{error}</p>
                </Card>
            )}

            <Card className="glass-card premium-shadow rounded-3xl overflow-hidden border-none">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-none">
                                <TableHead className="pl-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction Info</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Item Detail</TableHead>
                                <TableHead className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Condition</TableHead>
                                <TableHead className="text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Qty</TableHead>
                                <TableHead className="text-right pr-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReturns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <RotateCcw size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No returns found in ledger</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReturns.map((r, idx) => (
                                    <TableRow key={idx} className="group border-slate-50 dark:border-slate-800/50">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">INV #{r.invoiceId}</span>
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <User size={10} /> {r.customerName || 'Direct Client'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Package size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{r.itemName}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{r.reason || 'No reason provided'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                r.condition === 'AVAILABLE' 
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                                : r.condition === 'DAMAGED'
                                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                            }`}>
                                                {r.condition}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-slate-900 dark:text-white tabular-nums">
                                            {r.quantity}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tabular-nums">
                                                    {new Date(r.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">
                                                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </MainLayout>
    );
}
