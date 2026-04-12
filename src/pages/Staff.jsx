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

    const filteredStaff = staff.filter(s =>
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
        <MainLayout title="Staff Directory">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
                    <p className="text-sm text-slate-500">Manage your workforce, roles, and compensation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchStaff} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Add Staff Member
                    </Button>
                </div>
            </div>

            {/* ── Status Metrics ────────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Force Total</p>
                            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Active</p>
                            <p className="text-2xl font-black text-slate-900">{stats.active}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Roles</p>
                            <p className="text-2xl font-black text-slate-900">{stats.roles}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Directory Table ─────────────────────────────────────────────── */}
            <Card className="shadow-xl shadow-slate-200/50 overflow-hidden border-none">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Directory</CardTitle>
                            <CardDescription>
                                {filteredStaff.length} employee record{filteredStaff.length !== 1 ? 's' : ''} shown.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, role or email..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6"><TableSkeleton /></div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <Users size={48} className="mb-4" />
                            <p className="font-semibold text-lg">No staff members found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent">
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Join Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map((s) => (
                                    <TableRow key={s.id} className={cn(!s.isActive && 'opacity-60 bg-slate-50/50')}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-400">
                                                    {s.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{s.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.employeeId || `#EMP-${s.id}`}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadge role={s.role} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                                                <div className="flex items-center gap-2"><Mail size={12} className="text-slate-300" /> {s.email || '—'}</div>
                                                <div className="flex items-center gap-2"><Phone size={12} className="text-slate-300" /> {s.phone || '—'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                <Calendar size={14} className="text-slate-300" />
                                                {s.joinDate ? new Date(s.joinDate).toLocaleDateString() : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge active={s.isActive !== false} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setModal({ isOpen: true, data: s })}
                                                >
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

            <StaffModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchStaff}
                staff={modal.data}
            />
        </MainLayout>
    );
}
