import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Briefcase,
    Mail,
    Phone,
    Shield,
    Clock,
    History,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Wallet,
    Receipt
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import staffService from '../services/staffService';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

export default function StaffDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [member, att, adv] = await Promise.all([
                staffService.getById(id),
                staffService.getAttendanceByStaff(id),
                staffService.getAdvancesByStaff(id)
            ]);
            setStaff(member);
            setAttendance(Array.isArray(att) ? att : []);
            setAdvances(Array.isArray(adv) ? adv : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load staff records.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Payroll Logic ────────────────────────────────────────────────────────
    const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
    const totalAdvances = advances.reduce((acc, a) => acc + (a.amount || 0), 0);
    const dailyRate = (staff?.salary || 0) / 30;
    const currentEarnings = dailyRate * presentDays;
    const netPayout = Math.max(0, currentEarnings - totalAdvances);

    async function handleProcessPayroll() {
        if (!window.confirm(`Process payroll for ${staff.name}? \nNet Payout: ${fmt(netPayout)}`)) return;
        setSubmitting(true);
        try {
            // Logic to call staffService.recordPayout(id, { amount: netPayout, period: 'Month' })
            // For now, we simulate success
            await new Promise(r => setTimeout(r, 1000));
            alert('Payroll processed successfully!');
            fetchData();
        } catch (err) {
            setError('Failed to process payroll.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <MainLayout title="Processing Network...">
            <div className="flex flex-col items-center justify-center h-96 opacity-30">
                <Clock className="w-12 h-12 animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Accessing Personnel Files</p>
            </div>
        </MainLayout>
    );

    if (error) return (
        <MainLayout title="Access Denied">
            <div className="flex flex-col items-center justify-center h-96 text-rose-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">{error}</p>
                <Button variant="ghost" className="mt-6" onClick={() => navigate('/staff')}>Back to Roster</Button>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout title={`Staff Profile — ${staff?.name}`}>
            <div className="mb-8">
                <Button 
                    variant="ghost" 
                    className="gap-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                    onClick={() => navigate('/staff')}
                >
                    <ArrowLeft size={16} /> Back to Force Roster
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* ── Left Column: Profile Card ──────────────────────── */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="enterprise-card overflow-hidden">
                        <div className="h-32 bg-slate-900 flex items-end px-8 pb-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Shield size={120} className="text-blue-400" />
                            </div>
                            <div className="z-10 bg-white p-1 rounded-2xl shadow-xl -mb-12">
                                <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-3xl">
                                    {staff?.name?.charAt(0)}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {staff?.name}
                            </h2>
                            <p className="text-blue-500 font-black uppercase tracking-widest text-[10px] mt-2">
                                {staff?.role || 'Staff Member'}
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{staff?.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{staff?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Joined: {staff?.joinDate || 'Jan 2026'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Salary</p>
                                    <p className="text-lg font-black text-slate-900 mt-1">{fmt(staff?.salary)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Status</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        <div className={cn("h-2 w-2 rounded-full", staff?.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                                        <span className={cn("text-xs font-black uppercase tracking-tighter", staff?.isActive ? "text-emerald-600" : "text-slate-400")}>
                                            {staff?.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payroll Summary Card */}
                    <Card className="enterprise-card p-6 bg-slate-950 text-white border-none relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Wallet className="text-blue-400" size={20} />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Payroll Engine</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Attendance</p>
                                    <p className="text-xl font-black text-white mt-1">{presentDays} Days</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gross Earned</p>
                                    <p className="text-xl font-black text-white mt-1">{fmt(currentEarnings)}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Advances</p>
                                    <p className="text-xl font-black text-rose-400 mt-1">- {fmt(totalAdvances)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Payout</p>
                                    <p className="text-2xl font-black text-blue-400 mt-1">{fmt(netPayout)}</p>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-xl shadow-blue-500/20 gap-2"
                                onClick={handleProcessPayroll}
                                disabled={submitting || netPayout <= 0}
                            >
                                <Receipt size={16} /> Process Payout
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* ── Right Column: History Tabs ────────────────────── */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Attendance History */}
                    <Card className="enterprise-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <Clock size={20} className="text-blue-500" /> Attendance Records
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-xs mt-1 font-bold lowercase">Chronological log of check-ins and check-outs.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-none hover:bg-transparent">
                                        <TableHead className="pl-8 py-4 text-[9px] font-black uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-500">In-Time</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-500">Out-Time</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-500 pr-8 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center opacity-30 italic font-medium">No logs identified in the network.</TableCell>
                                        </TableRow>
                                    ) : (
                                        attendance.map((log, i) => (
                                            <TableRow key={i} className="border-slate-50">
                                                <TableCell className="pl-8 font-black text-slate-900">{log.date}</TableCell>
                                                <TableCell className="font-bold text-slate-500">{log.checkIn}</TableCell>
                                                <TableCell className="font-bold text-slate-500">{log.checkOut || '—'}</TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                                                        log.status === 'PRESENT' ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {log.status === 'PRESENT' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                        {log.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Advance History */}
                    <Card className="enterprise-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <History size={20} className="text-amber-500" /> Advance Ledger
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-xs mt-1 font-bold lowercase">Detailed tracking of financial advances and adjustments.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 border-none hover:bg-transparent">
                                        <TableHead className="pl-8 py-4 text-[9px] font-black uppercase tracking-wider text-slate-500">Transaction ID</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-500">Reason</TableHead>
                                        <TableHead className="text-right pr-8 text-[9px] font-black uppercase tracking-wider text-slate-500">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center opacity-30 italic font-medium">No financial advances identified.</TableCell>
                                        </TableRow>
                                    ) : (
                                        advances.map((adv, i) => (
                                            <TableRow key={i} className="border-slate-50">
                                                <TableCell className="pl-8 font-black text-slate-900 text-[10px] tracking-widest">#ADV-{adv.id}</TableCell>
                                                <TableCell className="font-bold text-slate-500">{adv.date}</TableCell>
                                                <TableCell className="font-bold text-slate-500 truncate max-w-[200px]">{adv.reason}</TableCell>
                                                <TableCell className="pr-8 text-right font-black text-rose-600">{fmt(adv.amount)}</TableCell>
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
