import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    RotateCcw, 
    ArrowLeft, 
    Loader2, 
    AlertCircle,
    Receipt,
    User,
    Calendar,
    CreditCard,
    Package,
    Tag
} from 'lucide-react';
import returnService from '../services/returnService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { formatDateOnly, formatTimeOnly } from '../utils/formatDate';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function ReturnDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isManagerOrOwner = user.roles?.includes('MANAGER') || user.roles?.includes('OWNER');

    const [returnObj, setReturnObj] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReturnDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await returnService.getById(id);
            setReturnObj(data);
        } catch (err) {
            setError(err.message ?? 'Failed to load return details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleApprove = async () => {
        try {
            await returnService.approve(id);
            fetchReturnDetails();
        } catch (err) {
            setError(err.message || 'Failed to approve return.');
        }
    };

    const handleReject = async () => {
        try {
            const reason = prompt("Enter reason for rejection:");
            if (reason === null) return; // User cancelled
            await returnService.reject(id, reason);
            fetchReturnDetails();
        } catch (err) {
            setError(err.message || 'Failed to reject return.');
        }
    };

    useEffect(() => {
        fetchReturnDetails();
    }, [fetchReturnDetails]);

    if (loading) {
        return (
            <MainLayout title="Loading Return...">
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 opacity-20" />
                    <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-400 animate-pulse">Fetching Return Data...</p>
                </div>
            </MainLayout>
        );
    }

    if (error || !returnObj) {
        return (
            <MainLayout title="Error">
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <AlertCircle className="h-12 w-12 text-rose-500 opacity-50" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{error || 'Return not found'}</p>
                    <Button onClick={() => navigate('/returns')} variant="ghost" className="gap-2">
                        <ArrowLeft size={16} /> Back to Returns
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={`Return ${returnObj.returnNumber}`}>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/returns')}
                        className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{returnObj.returnNumber}</h1>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[14px] font-semibold uppercase tracking-widest ${
                                returnObj.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                returnObj.status === 'PENDING' || !returnObj.status ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                            }`}>
                                {returnObj.status || 'PENDING'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                            Tied to Invoice <span className="font-bold text-slate-700 dark:text-slate-300">#{returnObj.invoiceNumber}</span>
                        </p>
                    </div>
                </div>

                {returnObj.status === 'PENDING' && isManagerOrOwner && (
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleApprove}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Approve
                        </Button>
                        <Button 
                            onClick={handleReject}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Reject
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border-none dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500">Total Refund</p>
                                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{fmt(returnObj.totalRefund)}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <RotateCcw size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500">Refund Mode</p>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-1 uppercase">{returnObj.paymentModeName || 'N/A'}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <CreditCard size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500">Date</p>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                                    {formatDateOnly(returnObj.createdAt)}
                                </h3>
                                <p className="text-[14px] text-slate-400 font-bold mt-0.5">
                                    {formatTimeOnly(returnObj.createdAt)}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <Calendar size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500">Created By</p>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate max-w-[120px]">
                                    {returnObj.createdBy?.split('@')[0] || 'System'}
                                </h3>
                                <p className="text-[14px] text-slate-400 font-bold mt-0.5 truncate max-w-[120px]">
                                    {returnObj.createdBy || ''}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <User size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Items Table */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="enterprise-card overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                        <TableHead className="pl-8 py-5 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Item Details</TableHead>
                                        <TableHead className="text-right text-[14px] font-semibold uppercase tracking-wider text-slate-500">Qty</TableHead>
                                        <TableHead className="text-right text-[14px] font-semibold uppercase tracking-wider text-slate-500">Price</TableHead>
                                        <TableHead className="text-right pr-8 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnObj.items?.map((item) => (
                                        <TableRow key={item.id} className="group border-slate-50 dark:border-slate-800/50">
                                            <TableCell className="pl-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <Package size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">{item.itemName}</span>
                                                        {item.variantName && (
                                                            <span className="text-[14px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <Tag size={10} /> {item.variantName}
                                                            </span>
                                                        )}
                                                        <span className={`inline-flex self-start mt-1 px-1.5 py-0.5 rounded text-[14px] font-semibold uppercase tracking-widest ${
                                                            item.conditionType === 'GOOD' 
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                                            : item.conditionType === 'DAMAGED'
                                                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                        }`}>
                                                            {item.conditionType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-slate-900 dark:text-white tabular-nums text-[14px]">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-slate-900 dark:text-white tabular-nums text-[14px]">
                                                {fmt(item.unitPrice)}
                                            </TableCell>
                                            <TableCell className="text-right pr-8 font-semibold text-slate-900 dark:text-white tabular-nums text-[14px]">
                                                {fmt(item.lineTotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Reason Box */}
                    {returnObj.reason && (
                        <Card className="bg-white border-none dark:bg-slate-900">
                            <CardContent className="p-6">
                                <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Return Reason</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {returnObj.reason}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Side: Customer & Invoice Summary */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    <Card className="bg-white border-none dark:bg-slate-900">
                        <CardContent className="p-6">
                            <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Customer Details</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {returnObj.customerName || 'Direct Client'}
                                    </h4>
                                    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        {returnObj.customerPhone || 'No phone provided'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Ref Card */}
                    <Card className="bg-white border-none dark:bg-slate-900">
                        <CardContent className="p-6">
                            <p className="text-[14px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Original Invoice</p>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Receipt size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{returnObj.invoiceNumber}</span>
                                </div>
                                <Button 
                                    onClick={() => navigate(`/invoices/${returnObj.invoiceId}`)}
                                    variant="ghost" 
                                    className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 h-8"
                                >
                                    View Invoice
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
