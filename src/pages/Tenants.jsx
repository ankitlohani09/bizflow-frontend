import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    Building2, 
    Users, 
    CheckCircle2, 
    XCircle, 
    MoreHorizontal,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    ShieldCheck,
    ArrowUpRight,
    Loader2,
    RefreshCw
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import tenantService from '../services/tenantService';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const BUSINESS_TYPES = [
    'Retail',
    'Restaurant',
    'Cafe',
    'Medical',
    'Service',
    'Other'
];

export default function Tenants() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Security: Only Super Admin (Tenant 1, ADMIN role)
    if (user.tenantId !== 1 || !(user.roles || []).includes('ADMIN')) {
        return <Navigate to="/dashboard" replace />;
    }

    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        businessType: 'Retail',
        isActive: true
    });

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const data = await tenantService.getAll();
            setTenants(data);
        } catch (error) {
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await tenantService.create(formData);
            toast.success('Tenant onboarded successfully!');
            setIsModalOpen(false);
            setFormData({
                name: '',
                code: '',
                ownerName: '',
                email: '',
                phone: '',
                address: '',
                businessType: 'Retail',
                isActive: true
            });
            fetchTenants();
        } catch (error) {
            toast.error(error.message || 'Failed to onboard tenant');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: tenants.length,
        active: tenants.filter(t => t.isActive).length,
        new: tenants.filter(t => {
            const date = new Date(t.createdAt);
            const now = new Date();
            return (now - date) < (7 * 24 * 60 * 60 * 1000);
        }).length
    };

    return (
        <MainLayout>
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Business Onboarding</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Manage & Register New Businesses</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchTenants} className="rounded-2xl border-slate-200">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </Button>
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 rounded-2xl px-6"
                    >
                        <Plus className="h-4 w-4" /> Onboard New
                    </Button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="grid gap-6 md:grid-cols-3 mb-10">
                <StatCard 
                    title="Total Businesses" 
                    value={stats.total} 
                    icon={Building2} 
                    color="indigo" 
                />
                <StatCard 
                    title="Active Tenants" 
                    value={stats.active} 
                    icon={CheckCircle2} 
                    color="emerald" 
                />
                <StatCard 
                    title="Recent Signups" 
                    value={stats.new} 
                    icon={ArrowUpRight} 
                    color="sky" 
                />
            </div>

            {/* Search & Filter */}
            <div className="mb-6 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search by name, code, or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-transparent border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-8 h-14">Business Name</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14">Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14">Contact</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14 text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pr-8 h-14 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 opacity-20" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Building2 size={48} />
                                            <p className="font-black uppercase tracking-widest text-xs">No businesses found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="dark:hover:bg-slate-800/30 border-slate-50 dark:border-slate-800/50 group h-20">
                                        <TableCell className="pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                                                    {tenant.code}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white tracking-tight">{tenant.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tenant.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                                <Briefcase size={10} /> {tenant.businessType}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                                    <Phone size={12} /> {tenant.phone || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                                    <MapPin size={12} className="shrink-0" /> <span className="truncate max-w-[150px]">{tenant.address || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                tenant.isActive 
                                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                                    : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                            )}>
                                                {tenant.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                                <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Onboarding Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Onboard New Business</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Setup tenant and owner account</p>
                                    </div>
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl">
                                        <Building2 className="text-indigo-600" />
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField 
                                            label="Business Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Sharma Supermart"
                                        />
                                        <InputField 
                                            label="Short Code"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. SS01"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField 
                                            label="Owner Name"
                                            name="ownerName"
                                            value={formData.ownerName}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Rajesh Sharma"
                                        />
                                        <InputField 
                                            label="Owner Email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="owner@example.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField 
                                            label="Phone Number"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="+91 9876543210"
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Business Type</label>
                                            <select 
                                                name="businessType"
                                                value={formData.businessType}
                                                onChange={handleInputChange}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white appearance-none cursor-pointer"
                                            >
                                                {BUSINESS_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <InputField 
                                        label="Business Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Full business address..."
                                    />

                                    <div className="pt-4 flex gap-4">
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-500"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                        >
                                            {submitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Complete Onboarding'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
    const colors = {
        indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        sky: 'bg-sky-500/10 text-sky-600 border-sky-500/20'
    };

    return (
        <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center gap-6">
                <div className={cn("p-4 rounded-2xl border", colors[color])}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
                </div>
            </div>
        </Card>
    );
}

function InputField({ label, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{label}</label>
            <input 
                {...props}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-bold"
            />
        </div>
    );
}
