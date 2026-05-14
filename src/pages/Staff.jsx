import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Plus,
    RefreshCw,
    Search,
    UserCheck,
    Mail,
    Phone,
    Calendar,
    Shield,
    FileDown,
    Pencil
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
import Pagination from '../components/ui/Pagination';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, X, Download } from 'lucide-react';


// ─── Sub-components ──────────────────────────────────────────────────────────

function RoleBadge({ role }) {
    const r = (role || '').toUpperCase();
    const styles = {
        ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
        MANAGER: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
        SALES: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        WAREHOUSE: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
        ACCOUNTANT: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50',
        HR: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
    };
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[14px] font-bold uppercase tracking-wider',
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [modal, setModal] = useState({ isOpen: false, data: null });
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [serverIp, setServerIp] = useState(window.location.hostname);
    const qrUrl = `http://${serverIp}:5173/check-in/${user.tenantCode}`;

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
        setCurrentPage(1);
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

    // Paginated results
    const paginatedStaff = filteredStaff.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Staff</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage permissions, compensation, and active personnel.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={fetchStaff} disabled={loading}>
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 font-bold px-6 rounded-xl shadow-lg shadow-amber-500/10"
                        onClick={() => setIsQRModalOpen(true)}
                    >
                        <QrCode className="h-4 w-4" /> Attendance QR
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-200" onClick={handleExportCSV}>
                        <FileDown className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold px-6 rounded-xl" onClick={() => setModal({ isOpen: true, data: null })}>
                        <Plus className="h-4 w-4" /> Hire New Staff
                    </Button>
                </div>
            </div>

            {/* ── Status Metrics ────────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="enterprise-card h-full p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-400">Total Count</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="enterprise-card h-full p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-400">Active Duty</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.active}</p>
                        </div>
                    </div>
                </Card>
                <Card className="enterprise-card h-full p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600">
                            <Shield size={28} />
                        </div>
                        <div>
                            <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-400">Unique Roles</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.roles}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {error && <Alert variant="error" message={error} className="mb-6" onClose={() => setError(null)} />}

            {/* ── Directory Table ─────────────────────────────────────────────── */}
            <Card className="enterprise-card overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-slate-900 border-none font-bold">Personnel Directory</CardTitle>
                            <CardDescription className="text-slate-500 font-medium capitalize">
                                {filteredStaff.length} active records identified in the network.
                            </CardDescription>
                        </div>

                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Name, Role or CID..."
                                className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow font-medium"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
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
                                    <TableRow className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                        <TableHead className="pl-8 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-[14px] font-black uppercase tracking-wider text-slate-500" onClick={() => handleSort('name')}>Name</TableHead>
                                        <TableHead className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-[14px] font-black uppercase tracking-wider text-slate-500" onClick={() => handleSort('role')}>Role</TableHead>
                                        <TableHead className="text-[14px] font-black uppercase tracking-wider text-slate-500">Contact</TableHead>
                                        <TableHead className="text-right pr-8 text-[14px] font-black uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStaff.map((staffMember) => (
                                        <TableRow
                                            key={staffMember.id}
                                            className={cn(
                                                !staffMember.isActive && 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20',
                                                'group border-slate-50 dark:border-slate-800'
                                            )}
                                        >
                                            <TableCell className="pl-8 py-6">
                                                <div
                                                    className="flex items-center gap-4 group cursor-pointer"
                                                    onClick={() => navigate(`/staff/${staffMember.id}`)}
                                                >
                                                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-all shadow-sm">
                                                        {staffMember.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none group-hover:text-blue-600 transition-colors">{staffMember.name}</span>
                                                        <span className="text-[14px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5 font-mono">{staffMember.employeeId || `ID_${staffMember.id.toString().padStart(4, '0')}`}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <RoleBadge role={staffMember.role} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">
                                                        <Mail size={12} className="text-blue-500" /> {staffMember.email || '—'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">
                                                        <Phone size={12} className="text-emerald-500" /> {staffMember.phone || '—'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex justify-end gap-1 opacity-10 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 rounded-full hover:bg-blue-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModal({ isOpen: true, data: staffMember });
                                                        }}
                                                    >
                                                        <Pencil size={14} className="text-slate-400 hover:text-blue-500" />
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

                {!loading && filteredStaff.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredStaff.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <StaffModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, data: null })}
                onSuccess={fetchStaff}
                staff={modal.data}
            />

            {/* Attendance QR Modal */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div className="bg-amber-500 p-8 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">Business QR</h2>
                                <p className="text-[14px] font-black uppercase tracking-widest text-amber-100">Attendance Scan Point</p>
                            </div>
                            <button onClick={() => setIsQRModalOpen(false)} className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center gap-6">
                            <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200 border-2 border-slate-50">
                                <QRCodeCanvas
                                    value={qrUrl}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    imageSettings={{
                                        src: "/logo.png",
                                        x: undefined,
                                        y: undefined,
                                        height: 40,
                                        width: 40,
                                        excavate: true,
                                    }}
                                />
                            </div>

                            <div className="text-center space-y-4 w-full">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Instructions</p>
                                    <p className="text-[14px] font-bold text-slate-400 leading-relaxed px-4">
                                        Display this QR at your shop entrance. Staff can scan using any smartphone to log their attendance securely.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest block mb-2">Network Server IP (for Mobile)</label>
                                    <input
                                        type="text"
                                        value={serverIp}
                                        onChange={(e) => setServerIp(e.target.value)}
                                        placeholder="e.g. 192.168.1.15"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                                    />
                                    <p className="text-[14px] text-amber-600 font-bold mt-2 uppercase tracking-wider">Use IP Address to work on mobile</p>
                                </div>
                            </div>

                            <div className="w-full flex gap-2">
                                <Button
                                    className="flex-1 gap-2 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest"
                                    onClick={() => window.print()}
                                >
                                    <Download size={16} /> Print QR
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
