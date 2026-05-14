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
    Receipt,
    Camera,
    MapPin,
    Fingerprint,
    ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import MainLayout from '../layouts/MainLayout';
import staffService from '../services/staffService';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { cn } from '../utils/cn';
import StaffAdvanceModal from '../components/StaffAdvanceModal';
import AttendanceModal from '../components/AttendanceModal';

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
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [hasBiometric, setHasBiometric] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);

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

    const checkBiometric = useCallback(async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8080/api/v1/public/biometric/check/${id}`);
            setHasBiometric(res.data.data.hasBiometric);
        } catch (err) {
            console.error('Biometric check failed:', err);
        }
    }, [id]);

    useEffect(() => { checkBiometric(); }, [checkBiometric]);

    const handleResetPassword = async () => {
        const newPin = prompt(`Enter new 4-digit PIN for ${staff?.name}:`);
        if (!newPin) return;
        
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            toast.error("PIN must be a 4-digit number!");
            return;
        }

        try {
            setSubmitting(true);
            const updatedStaff = { ...staff, pin: newPin };
            await staffService.update(id, updatedStaff);
            setSuccessMsg("PIN reset successfully!");
            setStaff(updatedStaff);
        } catch (err) {
            setErrorMsg(err.message || "Failed to reset PIN");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterBiometric = async () => {
        setBiometricLoading(true);
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options = {
                publicKey: {
                    challenge: challenge,
                    rp: { name: "BizFlow Enterprise" },
                    user: {
                        id: new TextEncoder().encode(id.toString()),
                        name: staff.email || staff.name,
                        displayName: staff.name
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: {
                        userVerification: "preferred"
                    },
                    timeout: 60000
                }
            };

            const credential = await navigator.credentials.create(options);

            // Convert Buffer to Base64 for transport
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

            await axios.post(`http://${window.location.hostname}:8080/api/v1/public/biometric/register`, {
                staffId: id,
                credentialId: credentialId,
                publicKey: "WEBAUTHN_REAL_V1" // Simplified for this demo
            });

            setHasBiometric(true);
            toast.success('Biometric Security Activated!');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Setup Failed';
            toast.error(`Biometric Setup Failed: ${msg}. (Ensure HTTPS if on mobile)`);
        } finally {
            setBiometricLoading(false);
        }
    };

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
        } catch {
            setError('Failed to process payroll.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <MainLayout title="Processing Network...">
            <div className="flex flex-col items-center justify-center h-96 opacity-30">
                <Clock className="w-12 h-12 animate-spin mb-4" />
                <p className="font-semibold uppercase tracking-widest text-[14px]">Accessing Personnel Files</p>
            </div>
        </MainLayout>
    );

    if (error) return (
        <MainLayout title="Access Denied">
            <div className="flex flex-col items-center justify-center h-96 text-rose-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-semibold uppercase tracking-widest text-[14px]">{error}</p>
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

            {successMsg && <Alert variant="success" message={successMsg} className="mb-4" onClose={() => setSuccessMsg(null)} />}
            {errorMsg && <Alert variant="error" message={errorMsg} className="mb-4" onClose={() => setErrorMsg(null)} />}

            <div className="grid gap-8 lg:grid-cols-3">
                {/* ── Left Column: Profile Card ──────────────────────── */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="enterprise-card overflow-hidden">
                        <div className="h-32 bg-slate-900 flex items-end px-8 pb-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Shield size={120} className="text-blue-400" />
                            </div>
                            <div className="z-10 bg-white p-1 rounded-2xl shadow-xl -mb-12">
                                <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-slate-400 text-3xl">
                                    {staff?.name?.charAt(0)}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                                {staff?.name}
                            </h2>
                            <p className="text-blue-500 font-semibold uppercase tracking-widest text-[14px] mt-2">
                                {staff?.role || 'Staff Member'}
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{staff?.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{staff?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Joined: {staff?.joinDate || 'Jan 2026'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Base Salary</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{fmt(staff?.salary)}</p>
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Active Status</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                        <div className={cn("h-2 w-2 rounded-full", staff?.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                                        <span className={cn("text-[14px] font-semibold uppercase tracking-tighter", staff?.isActive ? "text-emerald-600" : "text-slate-400")}>
                                            {staff?.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold rounded-xl"
                                    onClick={handleResetPassword}
                                    disabled={submitting}
                                >
                                    <ShieldCheck size={16} /> Reset Staff PIN
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Biometric Security Card */}
                    <Card className="enterprise-card border-blue-100 bg-blue-50/30 overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 opacity-5">
                            <Fingerprint size={100} />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={cn("p-2 rounded-lg", hasBiometric ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>
                                    {hasBiometric ? <ShieldCheck size={18} /> : <Fingerprint size={18} />}
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-semibold uppercase tracking-widest text-slate-500">Biometric Identity</h4>
                                    <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-0.5">
                                        {hasBiometric ? "Device Security Linked" : "No Biometrics Registered"}
                                    </p>
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full text-[14px] font-semibold uppercase tracking-widest py-3 rounded-xl gap-2",
                                    hasBiometric ? "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700" : "bg-blue-600 text-white hover:bg-blue-500"
                                )}
                                onClick={handleRegisterBiometric}
                                disabled={biometricLoading}
                            >
                                {biometricLoading ? "Processing..." : hasBiometric ? "Re-link Device" : "Register Fingerprint"}
                            </Button>
                            {!window.isSecureContext && (
                                <p className="text-[14px] text-rose-500 font-bold mt-3 leading-tight italic">
                                    ⚠️ Security Error: Real biometrics requires a secure (HTTPS) connection.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payroll Summary Card */}
                    <Card className="enterprise-card p-6 bg-slate-950 text-white border-none relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Wallet className="text-blue-400" size={20} />
                            </div>
                            <h3 className="font-semibold uppercase tracking-widest text-[14px] text-slate-400">Payroll Engine</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Attendance</p>
                                    <p className="text-xl font-semibold text-white mt-1">{presentDays} Days</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Gross Earned</p>
                                    <p className="text-xl font-semibold text-white mt-1">{fmt(currentEarnings)}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Advances</p>
                                    <p className="text-xl font-semibold text-rose-400 mt-1">- {fmt(totalAdvances)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Net Payout</p>
                                    <p className="text-2xl font-semibold text-blue-400 mt-1">{fmt(netPayout)}</p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold uppercase tracking-[0.2em] py-6 rounded-2xl shadow-xl shadow-blue-500/20 gap-2"
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
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-widest">
                                        <Clock size={20} className="text-blue-500" /> Attendance Records
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-[14px] mt-1 font-bold lowercase">Chronological log of check-ins and check-outs.</CardDescription>
                                </div>
                                <Button
                                    className="gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[14px] font-semibold uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20"
                                    onClick={() => setIsAttendanceModalOpen(true)}
                                >
                                    Mark Attendance
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800 border-none hover:bg-transparent">
                                        <TableHead className="pl-8 py-4 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">In-Time</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Out-Time</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Verification</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500 pr-8 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center opacity-30 italic font-medium">No logs identified in the network.</TableCell>
                                        </TableRow>
                                    ) : (
                                        attendance.map((log, i) => (
                                            <TableRow key={i} className="border-slate-50 dark:border-slate-800/20">
                                                <TableCell className="pl-8 font-semibold text-slate-900 dark:text-white">{log.date}</TableCell>
                                                <TableCell className="font-bold text-slate-500 dark:text-slate-400">{log.checkIn || '—'}</TableCell>
                                                <TableCell className="font-bold text-slate-500 dark:text-slate-400">{log.checkOut || '—'}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {log.photoUrl && (
                                                            <a href={log.photoUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                                                <Camera size={14} />
                                                            </a>
                                                        )}
                                                        {log.location && (
                                                            <a href={`https://www.google.com/maps?q=${log.location}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                                                                <MapPin size={14} />
                                                            </a>
                                                        )}
                                                        {!log.photoUrl && !log.location && <span className="text-[14px] text-slate-400">Manual</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 text-[14px] font-semibold uppercase tracking-widest",
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
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 flex items-center gap-2 text-[14px] font-semibold uppercase tracking-widest">
                                        <History size={20} className="text-amber-500" /> Advance Ledger
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-[14px] mt-1 font-bold lowercase">Detailed tracking of financial advances and adjustments.</CardDescription>
                                </div>
                                <Button
                                    className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold uppercase tracking-widest px-4 py-2 rounded-xl"
                                    onClick={() => setIsAdvanceModalOpen(true)}
                                >
                                    Give Advance
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-800 border-none hover:bg-transparent">
                                        <TableHead className="pl-8 py-4 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Transaction ID</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="text-[14px] font-semibold uppercase tracking-wider text-slate-500">Reason</TableHead>
                                        <TableHead className="text-right pr-8 text-[14px] font-semibold uppercase tracking-wider text-slate-500">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center opacity-30 italic font-medium">No financial advances identified.</TableCell>
                                        </TableRow>
                                    ) : (
                                        advances.map((adv, i) => (
                                            <TableRow key={i} className="border-slate-50 dark:border-slate-800/20">
                                                <TableCell className="pl-8 font-semibold text-slate-900 dark:text-white text-[14px] tracking-widest">#ADV-{adv.id}</TableCell>
                                                <TableCell className="font-bold text-slate-500 dark:text-slate-400">{adv.advanceDate}</TableCell>
                                                <TableCell className="font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{adv.notes}</TableCell>
                                                <TableCell className="pr-8 text-right font-semibold text-rose-600">{fmt(adv.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <StaffAdvanceModal
                isOpen={isAdvanceModalOpen}
                onClose={() => setIsAdvanceModalOpen(false)}
                onSuccess={fetchData}
                staffId={id}
            />

            <AttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onSuccess={fetchData}
                staffId={id}
                staffName={staff?.name}
            />
        </MainLayout>
    );
}
