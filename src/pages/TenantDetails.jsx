import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    Briefcase, 
    Calendar, 
    Users, 
    ShieldCheck, 
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Edit3,
    Trash2,
    CreditCard,
    TrendingUp
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import tenantService from '../services/tenantService';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';

export default function TenantDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchTenantDetails = useCallback(async () => {
        setLoading(true);
        try {
            const [tenantData, statsData] = await Promise.all([
                tenantService.getById(id),
                tenantService.getStats(id)
            ]);
            setTenant(tenantData);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to load tenant details');
            navigate('/tenants');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchTenantDetails();
    }, [fetchTenantDetails]);

    const handleEditClick = () => {
        setEditForm({ ...tenant });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await tenantService.update(id, editForm);
            toast.success('Business updated successfully');
            setIsEditModalOpen(false);
            fetchTenantDetails();
        } catch (error) {
            toast.error('Failed to update business');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                </div>
            </MainLayout>
        );
    }

    if (!tenant) return null;

    return (
        <MainLayout>
            {/* Header Area */}
            <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/tenants')}
                        className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                            {tenant.name}
                        </h1>
                        <p className="text-[14px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">
                            Business Intelligence & Profile
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline" 
                        className="rounded-2xl border-slate-200 h-14 px-8 text-sm font-black uppercase tracking-widest"
                        onClick={handleEditClick}
                    >
                        <Edit3 size={16} className="mr-2" /> Edit Business
                    </Button>
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl shadow-2xl shadow-rose-500/20 h-14 w-14 p-0 flex items-center justify-center">
                        <Trash2 size={20} />
                    </Button>
                </div>
            </div>

            {/* Main Content Grid: 1:2 Split */}
            <div className="grid gap-10 lg:grid-cols-3">
                
                {/* Left Column: Profile & Security (col-span-1) */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Profile Card */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                        <div className="p-10 pb-0">
                            <div className="flex items-center gap-6">
                                <div className="h-16 min-w-[4rem] w-auto px-2 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                                    {tenant.code}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{tenant.name}</h3>
                                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tenant.businessType} Management</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-10 space-y-6">
                            <div className="space-y-4">
                                <InfoItem icon={Mail} label="Email Address" value={tenant.email} />
                                <InfoItem icon={Phone} label="Phone Number" value={tenant.phone || 'N/A'} />
                                <InfoItem icon={MapPin} label="Location" value={tenant.address || 'N/A'} />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <p className="text-[14px] font-black uppercase tracking-widest text-slate-400">Account Status</p>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[14px] font-black uppercase tracking-widest",
                                        tenant.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                    )}>
                                        {tenant.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Protocols */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10">
                        <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-500" /> Security Protocols
                        </h4>
                        <div className="space-y-4">
                            <ProtocolItem label="GPS Geofencing" active={tenant.isGpsMandatory} />
                            <ProtocolItem label="Selfie Verification" active={tenant.isSelfieMandatory} />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Subscription & Metrics (col-span-2) */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Subscription Card - Matching AdminDashboard Distribution Style */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2.5rem] overflow-hidden p-10 relative group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 text-slate-200">
                            <CreditCard size={180} />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">Service Plan</h3>
                                <h2 className="text-3xl font-black tracking-tight mt-2 italic uppercase">{tenant.subscriptionPlan || 'TRIAL'}</h2>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">Expires On</p>
                                    <p className="text-xl font-black tracking-tight italic">
                                        {tenant.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'NEVER'}
                                    </p>
                                </div>
                                <div className="flex-1 max-w-xs">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[75%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-white/10">
                                <p className="text-[14px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                    Premium enterprise features enabled. Scalable infrastructure for operations.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid gap-10 md:grid-cols-2">
                        <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[14px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">User Usage</p>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {String(stats?.activeUsers || 0).padStart(2, '0')}
                                </h3>
                                <p className="text-sm font-bold text-slate-400 mb-1">/ {tenant.maxUsers || 5} Limit</p>
                            </div>
                            <div className="mt-4">
                                {stats?.activeUsers >= (tenant.maxUsers || 5) ? (
                                    <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[14px] font-black uppercase tracking-widest">Quota Exceeded</span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[14px] font-black uppercase tracking-widest">Within Limit</span>
                                )}
                            </div>
                        </Card>

                        <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-[14px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Monthly Transactions</p>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">
                                    {stats?.monthlyInvoices?.toLocaleString() || 0}
                                </h3>
                                <p className="text-sm font-bold text-slate-400 mb-1">Invoices</p>
                            </div>
                            <div className="mt-4">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[14px] font-black uppercase tracking-widest">Current Month</span>
                            </div>
                        </Card>
                    </div>

                    {/* Quick Info Alerts */}
                    <div className="p-10 rounded-[2.5rem] bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-tight">Billing Notice</h4>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-600/80 mt-1 leading-relaxed">
                                This tenant is currently using more users than allowed by their plan. Consider upgrading them to Enterprise or increasing their quota manually.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Business Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-transparent">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Business Configuration</h2>
                                <p className="text-[14px] text-slate-400 font-bold uppercase tracking-widest mt-1">Update platform-level settings for {tenant.name}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                                    <input 
                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Subscription Plan</label>
                                    <select 
                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={editForm.subscriptionPlan}
                                        onChange={(e) => setEditForm({...editForm, subscriptionPlan: e.target.value})}
                                    >
                                        <option value="TRIAL">TRIAL</option>
                                        <option value="PRO">PRO</option>
                                        <option value="ENTERPRISE">ENTERPRISE</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Max User Quota</label>
                                    <input 
                                        type="number"
                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={editForm.maxUsers}
                                        onChange={(e) => setEditForm({...editForm, maxUsers: parseInt(e.target.value)})}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                    <input 
                                        type="date"
                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={editForm.expiryDate ? editForm.expiryDate.split('T')[0] : ''}
                                        onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[14px]"
                                >
                                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : 'Update Business Configuration'}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="h-14 rounded-2xl px-8 border-slate-200 font-black uppercase tracking-widest text-[14px]"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 break-words">{value}</p>
            </div>
        </div>
    );
}

function ProtocolItem({ label, active }) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent">
            <span className="text-[14px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">{label}</span>
            {active ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
                <XCircle size={18} className="text-slate-300" />
            )}
        </div>
    );
}
