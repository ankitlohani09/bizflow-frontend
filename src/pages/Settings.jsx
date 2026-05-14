import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
    Check,
    Loader2,
    X,
    Percent,
    MapPin,
    Camera,
    ChefHat
} from 'lucide-react';
import tenantService from '../services/tenantService';
import MainLayout from '../layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Input from '../components/ui/Input';
import { cn } from '../utils/cn';
import brandingService from '../services/brandingService';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Palette, Sparkles, Image as ImageIcon } from 'lucide-react';
import paymentModeService from '../services/paymentModeService';
import taxRuleService from '../services/taxRuleService';
import userService from '../services/userService';
import { TIMEZONE_OPTIONS } from '../utils/formatDate';

const profileSchema = z.object({
    displayName: z.string().min(1, 'Name is required'),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits')
});

/**
 * Settings Page â€“ System configuration and Master Data
 */
export default function Settings() {
    const location = useLocation();
    const { branding, updateBranding, setBrandingPreview, timezone, changeTimezone } = useTheme();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isManagerOrOwner = user.roles?.includes('MANAGER') || user.roles?.includes('OWNER') || user.roles?.includes('ADMIN');
    const [activeTab, setActiveTab] = useState(isManagerOrOwner ? 'master' : 'account');

    // Handle tab switching from navigation state
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
            // Clear state to avoid switching back on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [localBranding, setLocalBranding] = useState(branding);
    const [isAiEnabled, setIsAiEnabled] = useState(localStorage.getItem('ai_enabled') !== 'false');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock tick for timezone preview
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // â”€â”€ Tax Rules state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [taxRules, setTaxRules] = useState([]);
    const [newTaxRule, setNewTaxRule] = useState({ name: '', rate: '', taxType: 'GST' });

    // â”€â”€ Payment Modes state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [paymentModes, setPaymentModes] = useState([]);
    const [newModeName, setNewModeName] = useState('');
    const [editingPm, setEditingPm] = useState(null); // Track mode being edited

    // â”€â”€ Tenant Attendance Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [tenant, setTenant] = useState(null);
    const [tenantSaving, setTenantSaving] = useState(false);

    // â”€â”€ Profile State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, formState: { errors: profileErrors } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: JSON.parse(localStorage.getItem('user') || '{}').name || '',
            phoneNumber: JSON.parse(localStorage.getItem('user') || '{}').phone || ''
        },
        mode: 'onChange'
    });
    const [profilePictureUrl, setProfilePictureUrl] = useState(JSON.parse(localStorage.getItem('user') || '{}').profilePictureUrl || '');

    // â”€â”€ Security State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
        if (activeTab === 'master') {
            loadPaymentModes();
            loadTaxRules();
            loadTenantSettings();
        }
    }, [activeTab]);

    async function loadTenantSettings() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.tenantId) return;
        try {
            const data = await tenantService.getById(user.tenantId);
            setTenant(data);
        } catch (err) {
            console.error('Failed to load tenant settings', err);
        }
    }

    async function handleUpdateTenantSetting(field, value) {
        if (!tenant) return;
        setTenantSaving(true);
        try {
            const updated = { ...tenant, [field]: value };
            const data = await tenantService.update(tenant.id, {
                ...updated,
                ownerName: JSON.parse(localStorage.getItem('user') || '{}').name
            });
            setTenant(data);
            window.dispatchEvent(new Event('tenant-updated'));
            setSuccessMsg('Attendance security updated.');
        } catch {
            setSuccessMsg('Failed to update attendance settings.');
        } finally {
            setTenantSaving(false);
        }
    }

    async function loadPaymentModes() {
        try {
            const data = await paymentModeService.getAll();
            setPaymentModes(Array.isArray(data) ? data : []);
        } catch {
            console.error('Failed to load payment modes.');
        }
    }

    async function handleAddMode(e) {
        e.preventDefault();
        if (!newModeName.trim()) return;
        try {
            if (editingPm) {
                await paymentModeService.update(editingPm.id, { ...editingPm, name: newModeName.trim() });
                setSuccessMsg('Payment mode updated.');
            } else {
                await paymentModeService.create({ name: newModeName.trim(), isActive: true });
                setSuccessMsg('Payment mode added.');
            }
            setNewModeName('');
            setEditingPm(null);
            await loadPaymentModes();
        } catch {
            setSuccessMsg(editingPm ? 'Failed to update payment mode.' : 'Failed to add payment mode.');
        }
    }


    async function handleDeleteMode(id) {
        try {
            await paymentModeService.delete(id);
            await loadPaymentModes();
        } catch {
            console.error('Failed to delete mode.');
        }
    }

    async function loadTaxRules() {
        try {
            const data = await taxRuleService.getAll();
            setTaxRules(Array.isArray(data) ? data : []);
        } catch {
            console.error('Failed to load tax rules.');
        }
    }

    async function handleAddTaxRule(e) {
        e.preventDefault();
        if (!newTaxRule.name.trim() || !newTaxRule.rate) return;
        try {
            await taxRuleService.create({ ...newTaxRule, rate: parseFloat(newTaxRule.rate) });
            setNewTaxRule({ name: '', rate: '', taxType: 'GST' });
            await loadTaxRules();
            setSuccessMsg('Tax rule added.');
        } catch {
            setSuccessMsg('Failed to add tax rule.');
        }
    }

    async function handleDeleteTaxRule(id) {
        try {
            await taxRuleService.delete(id);
            await loadTaxRules();
        } catch {
            console.error('Failed to delete tax rule.');
        }
    }


    return (
        <MainLayout title="System Configuration">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 font-medium">Control system preferences and manage master catalogs.</p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
                {/* â”€â”€ Sidebar Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                    {[
                        { id: 'master', label: 'Business Settings', icon: SettingsIcon },
                        { id: 'company', label: 'Business Profile', icon: Building },
                        { id: 'subscription', label: 'Subscription & Plan', icon: CreditCard },
                        { id: 'branding', label: 'Logo & Branding', icon: Palette },
                        { id: 'account', label: 'My Profile', icon: User },
                        { id: 'security', label: 'Security & Access', icon: ShieldCheck },
                    ].filter(tab => {
                        if (!isManagerOrOwner) {
                            return ['account', 'security'].includes(tab.id);
                        }
                        return true;
                    }).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-left",
                                activeTab === tab.id
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md shadow-slate-200 dark:shadow-none"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* â”€â”€ Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex-1 space-y-6">
                    {successMsg && <Alert variant="success" message={successMsg} className="mb-4" onClose={() => setSuccessMsg(null)} />}
                    {errorMsg && <Alert variant="error" message={errorMsg} className="mb-4" onClose={() => setErrorMsg(null)} />}

                    {activeTab === 'master' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Core Master Data */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Payment Modes - High Density Layout */}
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden group">
                                    <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-transparent">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                                                    <CreditCard size={22} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-slate-900 dark:text-white border-none font-semibold text-lg p-0">Payment Modes</CardTitle>
                                                    <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure accepted payment methods</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <form onSubmit={handleAddMode} className="flex items-center gap-3">
                                            <Input
                                                placeholder="e.g. UPI, Digital Wallet, Cash"
                                                value={newModeName}
                                                onChange={(e) => setNewModeName(e.target.value)}
                                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-none h-12 rounded-2xl font-bold dark:text-white"
                                            />
                                            <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold uppercase tracking-widest text-[14px]">
                                                {editingPm ? 'Update' : 'Add'}
                                            </Button>
                                        </form>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {paymentModes.map((mode) => (
                                                <div key={mode.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all group/item">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                                                            <Check size={14} className="text-blue-500" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-white">{mode.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <button onClick={() => handleDeleteMode(mode.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tax Rules - Modern Table Layout */}
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-transparent">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 -rotate-3 group-hover:rotate-0 transition-transform">
                                                <Percent size={22} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-slate-900 dark:text-white border-none font-semibold text-lg p-0">Tax Rules (GST/VAT)</CardTitle>
                                                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage reusable tax configurations</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <form onSubmit={handleAddTaxRule} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
                                            <div className="md:col-span-5"><Input placeholder="Rule Label" value={newTaxRule.name} onChange={(e) => setNewTaxRule({ ...newTaxRule, name: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-800 border-none font-bold dark:text-white" /></div>
                                            <div className="md:col-span-4"><Input type="number" placeholder="Rate %" value={newTaxRule.rate} onChange={(e) => setNewTaxRule({ ...newTaxRule, rate: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-800 border-none font-bold dark:text-white" /></div>
                                            <div className="md:col-span-3"><Button type="submit" className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold uppercase tracking-widest text-[14px]">Add Rule</Button></div>
                                        </form>

                                        <div className="space-y-2">
                                            {taxRules.map((rule) => (
                                                <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-emerald-50/50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center font-semibold text-emerald-600 shadow-sm">{rule.rate}%</div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-white">{rule.name}</p>
                                                            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Standard Rate</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteTaxRule(rule.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* App Modules - Feature Toggles */}
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden group mt-6">
                                    <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-r from-amber-50/50 to-transparent">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                                                <ChefHat size={22} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-slate-900 dark:text-white border-none font-semibold text-lg p-0">App Modules</CardTitle>
                                                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enable or disable features</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-amber-50/50 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-amber-600 shadow-sm">
                                                    <ChefHat size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Kitchen Module</p>
                                                    <p className="text-[14px] text-slate-400 font-bold mt-1">Enable Kitchen Orders for Restaurant mode</p>
                                                </div>
                                            </div>
                                            <button
                                                disabled={tenantSaving}
                                                onClick={() => handleUpdateTenantSetting('isKitchenEnabled', !tenant?.isKitchenEnabled)}
                                                className={cn(
                                                    "h-8 w-14 rounded-full relative transition-all duration-500",
                                                    tenant?.isKitchenEnabled ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-500",
                                                    tenant?.isKitchenEnabled ? "left-7.5" : "left-1.5"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-amber-50/50 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-amber-600 shadow-sm">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">AI Insights</p>
                                                    <p className="text-[14px] text-slate-400 font-bold mt-1">Enable AI-powered business chat and predictions</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newValue = !isAiEnabled;
                                                    setIsAiEnabled(newValue);
                                                    localStorage.setItem('ai_enabled', String(newValue));
                                                    window.dispatchEvent(new Event('ai-setting-changed'));
                                                }}
                                                className={cn(
                                                    "h-8 w-14 rounded-full relative transition-all duration-500",
                                                    isAiEnabled ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-500",
                                                    isAiEnabled ? "left-7.5" : "left-1.5"
                                                )} />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: High-Security Protocols */}
                            <div className="lg:col-span-5">
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl rounded-[3rem] overflow-hidden sticky top-6">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                        <ShieldCheck size={200} className="text-indigo-600" />
                                    </div>
                                    <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-br from-indigo-50/50 to-transparent">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 rotate-6">
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-slate-900 dark:text-white border-none font-semibold text-xl p-0">Attendance Rules</CardTitle>
                                                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Enforce security for staff check-ins</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10 space-y-8">
                                        <div className="space-y-4">
                                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-indigo-50/50 transition-all">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 shadow-sm">
                                                        <Camera size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">AI Face Verification</p>
                                                        <p className="text-[14px] text-slate-400 font-bold mt-1">Enforce mandatory check-in selfie</p>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={tenantSaving}
                                                    onClick={() => handleUpdateTenantSetting('isSelfieMandatory', !tenant?.isSelfieMandatory)}
                                                    className={cn(
                                                        "h-8 w-14 rounded-full relative transition-all duration-500",
                                                        tenant?.isSelfieMandatory ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-slate-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-500",
                                                        tenant?.isSelfieMandatory ? "left-7.5" : "left-1.5"
                                                    )} />
                                                </button>
                                            </div>

                                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-indigo-50/50 transition-all">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-emerald-600 shadow-sm">
                                                        <MapPin size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">GPS Geofencing</p>
                                                        <p className="text-[14px] text-slate-400 font-bold mt-1">Validate physical store presence</p>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={tenantSaving}
                                                    onClick={() => handleUpdateTenantSetting('isGpsMandatory', !tenant?.isGpsMandatory)}
                                                    className={cn(
                                                        "h-8 w-14 rounded-full relative transition-all duration-500",
                                                        tenant?.isGpsMandatory ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-slate-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-500",
                                                        tenant?.isGpsMandatory ? "left-7.5" : "left-1.5"
                                                    )} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                            <div className="flex gap-3">
                                                <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
                                                <p className="text-[14px] text-slate-500 font-bold leading-relaxed">
                                                    Protocols are enforced globally for all QR-based staff attendance. Mobile devices will prompt for hardware permissions.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'company' && (
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                                <CardTitle className="text-slate-900 border-none font-bold">Company Profile</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">This information will appear on your invoices and reports.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <Input label="Business Name" defaultValue="BizFlow Solutions Pvt Ltd" />
                                    <Input label="Tax ID / GSTIN" defaultValue="27AAAAA0000A1Z5" />
                                    <Input label="Email" defaultValue="contact@bizflow.com" />
                                    <Input label="Phone" defaultValue="+91 99999 88888" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-bold text-slate-700 uppercase">Registered Address</label>
                                    <textarea
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all dark:text-white"
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
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
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
                                        <label className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest">Primary Identity Color</label>
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
                                    className="p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-all overflow-hidden relative shadow-sm hover:shadow-xl hover:shadow-primary/5"
                                    onClick={() => document.getElementById('logo-upload').click()}
                                >
                                    {localBranding.logoUrl ? (
                                        <div className="relative w-full flex flex-col items-center justify-center gap-4">
                                            <div className="relative h-32 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                                <img
                                                    src={localBranding.logoUrl.startsWith('blob:') || localBranding.logoUrl.startsWith('data:') || localBranding.logoUrl.startsWith('http')
                                                        ? localBranding.logoUrl
                                                        : `${import.meta.env.VITE_API_URL}${localBranding.logoUrl.startsWith('/') ? '' : '/'}${localBranding.logoUrl}`}
                                                    alt="Logo Preview"
                                                    className="h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl text-white text-[14px] font-semibold uppercase tracking-widest">Click to Change</div>
                                            </div>
                                            
                                            {/* Premium Remove Button inside the card */}
                                            <button
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 z-10"
                                                onClick={async (e) => {
                                                    e.stopPropagation(); // Prevent triggering file upload
                                                    try {
                                                        await brandingService.deleteLogo();
                                                        setLocalBranding(prev => ({ ...prev, logoUrl: null }));
                                                        
                                                        // Live preview in sidebar
                                                        setBrandingPreview({ logoUrl: null });
                                                        
                                                        setSuccessMsg('Logo removed successfully!');
                                                        window.dispatchEvent(new Event('theme-updated'));
                                                        
                                                        // Reset file input value so the same file can be selected again
                                                        const fileInput = document.getElementById('logo-upload');
                                                        if (fileInput) fileInput.value = '';
                                                    } catch (error) {
                                                        console.error('Failed to delete logo:', error);
                                                        setSuccessMsg('Failed to remove logo.');
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                                <ImageIcon size={36} />
                                            </div>
                                            <p className="mt-6 text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Upload Company Logo</p>
                                            <p className="text-[11px] text-slate-400 font-bold mt-2 tracking-wide">PNG or SVG, max 500kb</p>
                                        </>
                                    )}
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const previewUrl = URL.createObjectURL(file);
                                                setLocalBranding(p => ({ ...p, logoUrl: previewUrl }));
                                                
                                                // Live preview in sidebar
                                                setBrandingPreview({ logoUrl: previewUrl });

                                                try {
                                                    setSuccessMsg('Syncing logo with server...');
                                                    const res = await brandingService.uploadLogo(file);
                                                    const serverPath = res.logoUrl || res.path || res.url;
                                                    setLocalBranding(p => ({ ...p, logoUrl: serverPath }));
                                                    setSuccessMsg('Branding asset synced successfully!');
                                                } catch (error) {
                                                    console.error('Logo upload failed:', error);
                                                    setSuccessMsg('Upload failed.');
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button
                                        className="bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white px-10 font-semibold uppercase tracking-widest text-[14px] h-12 rounded-xl shadow-xl shadow-slate-200 dark:shadow-none"
                                        onClick={async () => {
                                            // Final safety check: if it's a blob, don't save it
                                            if (localBranding.logoUrl && localBranding.logoUrl.startsWith('blob:')) {
                                                setSuccessMsg('Logo is still processing, please wait...');
                                                return;
                                            }
                                            await updateBranding(localBranding);
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
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                                <CardTitle className="text-slate-900 border-none font-bold">Account Settings</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">Manage your personal information and profile visibility.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                {/* Profile Picture Section */}
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-4 border-white dark:border-slate-800 shadow-2xl shadow-indigo-500/10 flex items-center justify-center overflow-hidden">
                                            {profilePictureUrl ? (
                                                <img
                                                    src={profilePictureUrl.startsWith('http') ? profilePictureUrl : (import.meta.env.VITE_API_URL) + profilePictureUrl}
                                                    className="h-full w-full object-cover"
                                                    alt="Profile"
                                                />
                                            ) : (
                                                <User size={48} className="text-indigo-200" />
                                            )}
                                            <div
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
                                                onClick={() => document.getElementById('profile-upload').click()}
                                            >
                                                <ImageIcon size={24} className="text-white" />
                                            </div>
                                        </div>
                                        <input
                                            id="profile-upload"
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // Check file size (1MB limit)
                                                    if (file.size > 1024 * 1024) {
                                                        setSuccessMsg(null);
                                                        setErrorMsg(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size allowed is 1MB.`);
                                                        return;
                                                    }
                                                    try {
                                                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                        const res = await userService.updateProfilePicture(user.id, file);
                                                        localStorage.setItem('user', JSON.stringify(res));
                                                        setProfilePictureUrl(res.profilePictureUrl);
                                                        setSuccessMsg('Profile picture updated successfully.');
                                                        setErrorMsg(null);
                                                        window.dispatchEvent(new Event('user-updated'));
                                                    } catch (err) {
                                                        setSuccessMsg(null);
                                                        setErrorMsg(err.message || 'Failed to upload profile picture.');
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Avatar</h3>
                                        <p className="text-[14px] font-medium text-slate-500 max-w-xs leading-relaxed">
                                            Click on the image to upload a new profile picture. Recommended size is 256x256px. Max size: 1MB.
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-500 font-bold p-0 h-auto hover:bg-transparent"
                                            onClick={async () => {
                                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                if (user.profilePictureUrl) {
                                                    try {
                                                        const res = await userService.deleteProfilePicture(user.id);
                                                        localStorage.setItem('user', JSON.stringify(res));
                                                        setProfilePictureUrl('');
                                                        setSuccessMsg('Profile picture removed.');
                                                        setErrorMsg(null);
                                                        window.dispatchEvent(new Event('user-updated'));
                                                    } catch (err) {
                                                        setSuccessMsg(null);
                                                        setErrorMsg(err.message || 'Failed to remove profile picture.');
                                                    }
                                                }
                                            }}
                                        >
                                            Remove Picture
                                        </Button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmitProfile(async (data) => {
                                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                                    try {
                                        await userService.updateProfile(user.id, { name: data.displayName, phone: data.phoneNumber, email: user.email });
                                        // Update local storage
                                        localStorage.setItem('user', JSON.stringify({ ...user, name: data.displayName, phone: data.phoneNumber }));
                                        setSuccessMsg('Account data saved successfully.');
                                        setErrorMsg(null);
                                        window.dispatchEvent(new Event('user-updated'));
                                    } catch (err) {
                                        setSuccessMsg(null);
                                        setErrorMsg(err.message || 'Failed to save account data.');
                                    }
                                })}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Input 
                                                label="Display Name" 
                                                {...registerProfile('displayName')} 
                                                className={profileErrors.displayName ? 'border-rose-500' : ''}
                                            />
                                            {profileErrors.displayName && <p className="text-rose-500 text-[14px] font-bold mt-0.5 ml-1">{profileErrors.displayName.message}</p>}
                                        </div>
                                        <Input label="Email Address" defaultValue={JSON.parse(localStorage.getItem('user') || '{}').email} disabled />
                                        <div>
                                            <Input 
                                                label="Phone Number" 
                                                {...registerProfile('phoneNumber')} 
                                                maxLength={10}
                                                placeholder="Enter phone number" 
                                                className={profileErrors.phoneNumber ? 'border-rose-500' : ''}
                                            />
                                            {profileErrors.phoneNumber && <p className="text-rose-500 text-[14px] font-bold mt-0.5 ml-1">{profileErrors.phoneNumber.message}</p>}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 flex justify-end mt-6">
                                        <Button
                                            type="submit"
                                            className="bg-slate-900 dark:bg-slate-800 text-white px-8 font-bold rounded-xl h-12 shadow-xl shadow-slate-200 dark:shadow-none"
                                        >
                                            Save Account Data
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'subscription' && (
                        <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-br from-amber-50/50 to-transparent">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-[1.25rem] bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
                                        <CreditCard size={28} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-slate-900 dark:text-white border-none font-semibold text-xl p-0">Current Subscription</CardTitle>
                                        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Manage your service plan and usage limits</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Active Plan</p>
                                        <h4 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase">{tenant?.subscriptionPlan || 'TRIAL'}</h4>
                                        <span className="inline-flex mt-3 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[14px] font-semibold uppercase">Active Now</span>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Valid Until</p>
                                        <h4 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase">
                                            {tenant?.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString() : 'N/A'}
                                        </h4>
                                        <p className="text-[14px] font-bold text-slate-400 uppercase mt-2">Auto-renewal: Disabled</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-2">User Quota</p>
                                        <h4 className="text-2xl font-semibold text-slate-900 dark:text-white uppercase">{tenant?.maxUsers || 5} Staff</h4>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-amber-500 w-[60%]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-semibold uppercase tracking-tight">Upgrade your plan</h3>
                                        <p className="text-slate-400 text-sm mt-2 max-w-md font-medium">Unlock advanced AI insights, unlimited staff accounts, and custom invoice templates with our Enterprise plan.</p>
                                        <Button className="mt-8 bg-white text-slate-900 hover:bg-slate-100 px-8 font-semibold uppercase tracking-widest text-[14px] h-12 rounded-xl">
                                            View Pricing Models
                                        </Button>
                                    </div>
                                    <Sparkles className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700" size={300} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="enterprise-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 p-8">
                                <CardTitle className="text-slate-900 border-none font-bold">Security & Privacy</CardTitle>
                                <CardDescription className="text-slate-500 font-medium">Update your password and manage security settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Current Password"
                                            type="password"
                                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                            autoComplete="current-password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <Input
                                        label="New Password"
                                        type="password"
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />

                                    <div className="md:col-span-2 pt-4">
                                        <Button
                                            className="bg-primary text-white px-10 font-bold rounded-xl h-12 shadow-xl shadow-primary/10 w-full md:w-auto"
                                            onClick={async () => {
                                                if (!currentPassword || !newPassword || !confirmPassword) {
                                                    setSuccessMsg(null);
                                                    setErrorMsg('All fields are required.');
                                                    return;
                                                }
                                                if (newPassword !== confirmPassword) {
                                                    setSuccessMsg(null);
                                                    setErrorMsg('New password and confirm password do not match.');
                                                    return;
                                                }
                                                if (newPassword.length < 6) {
                                                    setSuccessMsg(null);
                                                    setErrorMsg('Password must be at least 6 characters long.');
                                                    return;
                                                }

                                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                try {
                                                    // Use updateProfile to update password
                                                    await userService.updateProfile(user.id, {
                                                        name: user.name,
                                                        phone: user.phone,
                                                        email: user.email,
                                                        password: newPassword,
                                                        currentPassword: currentPassword
                                                    });
                                                    setSuccessMsg('Password changed successfully.');
                                                    setErrorMsg(null);
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmPassword('');
                                                } catch (err) {
                                                    setSuccessMsg(null);
                                                    setErrorMsg(err.message || 'Failed to change password.');
                                                }
                                            }}
                                        >
                                            Change Password
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
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
                <p className="text-[14px] text-slate-500 font-medium">Manage definitions and standards for your catalog.</p>
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
