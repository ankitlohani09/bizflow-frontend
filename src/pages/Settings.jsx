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
import { useTheme } from '../context/ThemeContext';
import { Palette, Sparkles, Image as ImageIcon } from 'lucide-react';

/**
 * Settings Page – System configuration and Master Data
 */
export default function Settings() {
    const navigate = useNavigate();
    const { branding, updateBranding } = useTheme();
    const [activeTab, setActiveTab] = useState('master');
    const [successMsg, setSuccessMsg] = useState(null);
    
    // Internal state for form
    const [localBranding, setLocalBranding] = useState(branding);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <MainLayout title="System Configuration">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 font-medium">Control system preferences and manage master catalogs.</p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
                {/* ── Sidebar Navigation ────────────────────────────────────────── */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    {[
                        { id: 'master', label: 'Master Data', icon: Database },
                        { id: 'company', label: 'Company Profile', icon: Building },
                        { id: 'branding', label: 'Branding', icon: Palette },
                        { id: 'account', label: 'Account', icon: User },
                        { id: 'security', label: 'Security', icon: ShieldCheck },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                    : "text-slate-500 hover:bg-white hover:text-slate-900"
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
                            <MasterDataCard title="Product Categories" icon={Layers} color="icon-box-blue" />
                            <MasterDataCard title="Measurement Units" icon={Box} color="icon-box-emerald" />
                            <MasterDataCard title="Payment Modes" icon={CreditCard} color="icon-box-indigo" />
                            <Card className="border-dashed border-2 border-slate-200 bg-white flex flex-col items-center justify-center p-8 text-center opacity-40 rounded-2xl">
                                <Plus size={32} />
                                <p className="mt-2 text-[10px] font-black uppercase tracking-widest">Add Data Layer</p>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'company' && (
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                <CardTitle className="text-slate-900 border-none font-bold">Corporate Profile</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">This information appears on your invoices and reports.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-8">
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
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 font-bold rounded-xl" onClick={() => setSuccessMsg('Profile updated successfully.')}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'branding' && (
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-slate-900 border-none font-bold">Visual Identity</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium">Customize how BizFlow appears to your team and clients.</CardDescription>
                                    </div>
                                    <Sparkles className="text-blue-500 opacity-20" size={48} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-10 p-8">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Identity Color</label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="color" 
                                                className="h-12 w-20 rounded-xl cursor-pointer border-none bg-transparent"
                                                value={localBranding.primaryColor}
                                                onChange={(e) => setLocalBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            />
                                            <div className="flex-1">
                                                <Input 
                                                    value={localBranding.primaryColor} 
                                                    onChange={(e) => setLocalBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                    placeholder="#3b82f6" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Input 
                                        label="Public Product Name" 
                                        value={localBranding.companyName} 
                                        onChange={(e) => setLocalBranding(prev => ({ ...prev, companyName: e.target.value }))}
                                    />
                                </div>

                                <div 
                                    className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white transition-all overflow-hidden relative"
                                    onClick={() => document.getElementById('logo-upload').click()}
                                >
                                    {localBranding.logoUrl ? (
                                        <div className="relative h-24 w-full flex items-center justify-center">
                                            <img src={localBranding.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black uppercase">Click to Change</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
                                                <ImageIcon size={32} />
                                            </div>
                                            <p className="mt-4 text-xs font-black text-slate-900 uppercase tracking-tighter">Upload Company Logo</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">PNG or SVG, max 500kb</p>
                                        </>
                                    )}
                                    <input 
                                        id="logo-upload"
                                        type="file" 
                                        hidden 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (f) => setLocalBranding(p => ({ ...p, logoUrl: f.target.result }));
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button 
                                        className="bg-slate-900 hover:bg-black text-white px-10 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl shadow-slate-200" 
                                        onClick={() => {
                                            updateBranding(localBranding);
                                            setSuccessMsg('Branding updated. Your interface has been refreshed.');
                                        }}
                                    >
                                        <Sparkles size={16} className="mr-2" /> Apply Visual System
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'account' && (
                        <Card className="enterprise-card p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-40">
                            Account preferences coming soon.
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="enterprise-card p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-40">
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
        <Card className="enterprise-card p-6 transition-all hover:shadow-md cursor-pointer group">
            <div className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className={cn("icon-box h-10 w-10", color)}>
                        <Icon size={18} />
                    </div>
                    <CardTitle className="text-slate-900 border-none font-bold text-base">{title}</CardTitle>
                </div>
                <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-500" />
            </div>
            <div className="mt-4">
                <p className="text-xs text-slate-500 font-medium">Manage definitions and standards for your catalog.</p>
            </div>
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
