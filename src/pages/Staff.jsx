import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Plus,
    RefreshCw,
    Search,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    MoreVertical,
    TrendingUp,
    Shield,
    DollarSign,
    FileDown,
    Pencil,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import staffService from '../services/staffService';
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
import StaffModal from '../components/StaffModal';
import { exportToCSV, flattenData } from '../utils/exportUtils';
import { cn } from '../utils/cn';

const fmt = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val ?? 0);

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoleBadge({ role }) {
    const r = (role || '').toUpperCase();
    const styles = {
        ADMIN:      'bg-indigo-50 text-indigo-700 border-indigo-100',
        MANAGER:    'bg-blue-50 text-blue-700 border-blue-100',
        SALES:      'bg-emerald-50 text-emerald-700 border-emerald-100',
        WAREHOUSE:  'bg-amber-50 text-amber-700 border-amber-100',
        ACCOUNTANT: 'bg-violet-50 text-violet-700 border-violet-100',
        HR:         'bg-rose-50 text-rose-700 border-rose-100',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            styles[r] ?? 'bg-slate-50 text-slate-500 border-slate-100'
        )}>
            {role || 'Other'}
        </span>
    );
}

function StatusBadge({ active }) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-bold leading-none',
            active ? 'text-emerald-600' : 'text-slate-400'
        )}>
            <div className={cn('h-2 w-2 rounded-full', active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
            {active ? 'Active' : 'Former Employee'}
        </span>
    );
}

function TableSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-50" />
            ))}
        </div>
    );
}

// ─── Staff Page ───────────────────────────────────────────────────────────────

export default function Staff() {
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, data: null });

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffService.getAll();
            setStaff(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message ?? 'Failed to load staff directory.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExportCSV = () => {
        const data = flattenData(filteredStaff);
        exportToCSV(data, 'staff-roster');
    };

    const sortedStaff = [...staff].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredStaff = sortedStaff.filter(s =>
        (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.role ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.isActive !== false).length,
        roles: [...new Set(staff.map(s => s.role))].length,
    };

    return (
        <MainLayout title="Human Resources">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Force Roster</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage permissions, compensation, and active personnel.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchStaff} disabled={loading} className="dark:text-slate-400">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="outline" className="gap-2 dark:border-slate-800 dark:text-slate-300" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> Export Roster
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Add Personnel
                    </Button>
                </div>
            </div>

            {/* ── Status Metrics ────────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4 text-blue-600">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Count</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-emerald-600">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Duty</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.active}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 p-4 text-indigo-600">
                            <Shield size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unique Roles</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.roles}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Directory Table ─────────────────────────────────────────────── */}
            <Card className="shadow-2xl shadow-slate-200/50 dark:shadow-none border-none ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="dark:text-white tracking-tighter">Personnel Directory</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                {filteredStaff.length} active records identified in the network.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Name, Role or CID..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-8"><TableSkeleton rows={6} /></div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <Users size={64} className="mb-4" />
                            <p className="font-black text-xl uppercase tracking-widest">No Matches</p>
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                    <TableHead className="pl-8 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('name')}>Identity</TableHead>
                                    <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('role')}>Classification</TableHead>
                                    <TableHead>Contact Link</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map((staffMember) => (
                                    <TableRow key={staffMember.id} className={cn(!staffMember.isActive && 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20', 'group dark:border-slate-800 dark:hover:bg-slate-800/40')}>
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-lg shadow-sm">
                                                    {staffMember.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter leading-none">{staffMember.name}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{staffMember.employeeId || `ID_${staffMember.id.toString().padStart(4, '0')}`}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadge role={staffMember.role} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                                                    <Mail size={12} className="text-blue-500" /> {staffMember.email || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                                                    <Phone size={12} className="text-emerald-500" /> {staffMember.phone || '—'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                                    onClick={() => setModal({ isOpen: true, data: staffMember })}
                                                >
                                                    <Pencil size={14} className="text-slate-400 hover:text-blue-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                >
                                                    <MoreVertical size={14} className="text-slate-400" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <StaffModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchStaff}
                staff={modal.data}
            />
        </MainLayout>
    );
}
