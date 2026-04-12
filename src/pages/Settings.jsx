import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Database,
    Layers,
    CreditCard,
    Box,
    Plus,
    Trash2,
    Save,
    Building,
    ShieldCheck,
    Globe,
    User,
    LogOut,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Input from '../components/ui/Input';
import { cn } from '../utils/cn';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

/**
 * Settings Page – System configuration and Master Data
 */
export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('master');
    const [successMsg, setSuccessMsg] = useState(null);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <MainLayout title="System Configuration">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Settings</h1>
                <p className="text-sm text-slate-500 font-medium">Control system preferences and manage master catalogs.</p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
                {/* ── Sidebar Navigation ────────────────────────────────────────── */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    {[
                        { id: 'master', label: 'Master Data', icon: Database },
                        { id: 'company', label: 'Company Profile', icon: Building },
                        { id: 'account', label: 'Account', icon: User },
                        { id: 'security', label: 'Security', icon: ShieldCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all w-full"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Content Area ──────────────────────────────────────────────── */}
                <div className="flex-1 space-y-6">
                    {successMsg && <Alert variant="success" message={successMsg} className="mb-4" onClose={() => setSuccessMsg(null)} />}

                    {activeTab === 'master' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <MasterDataCard title="Product Categories" icon={Layers} color="bg-blue-500" />
                            <MasterDataCard title="Measurement Units" icon={Box} color="bg-emerald-500" />
                            <MasterDataCard title="Payment Modes" icon={CreditCard} color="bg-indigo-500" />
                            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center opacity-40">
                                <Plus size={32} />
                                <p className="mt-2 font-bold">Add Data Layer</p>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'company' && (
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
                            <CardHeader>
                                <CardTitle>Corporate Profile</CardTitle>
                                <CardDescription>This information appears on your invoices and reports.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <Input label="Business Name" defaultValue="BizFlow Solutions Pvt Ltd" />
                                    <Input label="Tax ID / GSTIN" defaultValue="27AAAAA0000A1Z5" />
                                    <Input label="Email" defaultValue="contact@bizflow.com" />
                                    <Input label="Phone" defaultValue="+91 99999 88888" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase">Registered Address</label>
                                    <textarea
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                        rows={3}
                                        defaultValue="123, Tech Plaza, BKC, Mumbai, Maharashtra 400051"
                                    />
                                </div>
                                <Button className="bg-slate-900 text-white gap-2 px-8" onClick={() => setSuccessMsg('Profile updated successfully.')}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'account' && (
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 p-8 text-center text-slate-400 font-medium">
                            Account preferences coming soon.
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 p-8 text-center text-slate-400 font-medium">
                            Security settings and API keys coming soon.
                        </Card>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

function MasterDataCard({ title, icon: Icon, color }) {
    return (
        <Card className="border-none shadow-lg shadow-slate-200/30 ring-1 ring-slate-100 hover:scale-[1.02] transition-transform cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl text-white", color)}>
                        <Icon size={18} />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                </div>
                <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-500" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-slate-400">Manage definitions and standards for your catalog.</p>
            </CardContent>
        </Card>
    );
}

function MoreVertical({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    );
}
