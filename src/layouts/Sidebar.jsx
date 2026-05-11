import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    TrendingUp,
    FileText,
    Wallet,
    UserCog,
    Settings,
    LogOut,
    Store,
    X,
    RotateCcw,
    History,
    ChefHat,
    Sparkles,
    Terminal,
    Building2
} from 'lucide-react';
import { cn } from '../utils/cn';
import authService from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import tenantService from '../services/tenantService';

const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Reports', icon: TrendingUp, path: '/analytics' },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'Suppliers', icon: Users, path: '/suppliers' },
    { label: 'Inventory', icon: Package, path: '/inventory' },
    { label: 'Stock Movements', icon: History, path: '/stock-movements' },
    { label: 'Invoices', icon: FileText, path: '/invoices' },
    { label: 'Returns', icon: RotateCcw, path: '/returns' },
    { label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
    { label: 'Expenses', icon: Wallet, path: '/expenses' },
    { label: 'Staff', icon: UserCog, path: '/staff' },
    { label: 'Kitchen Orders', icon: ChefHat, path: '/kitchen-orders', featureFlag: 'isKitchenEnabled' },
    { label: 'AI Insights', icon: Sparkles, path: '/ai-insights' },
    { label: 'System Logs', icon: Terminal, path: '/logs' },
    { label: 'Tenants', icon: Building2, path: '/tenants', superOnly: true },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

function SidebarItem({ item }) {
    const Icon = item.icon;
    const { t } = useTranslation();

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                cn(
                    'group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300',
                    isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-primary'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <Icon className={cn('h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary')} />
                    <span className="tracking-tight">{t(item.label)}</span>
                    {isActive && (
                        <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-2 h-5 w-1 rounded-full bg-white/40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { branding } = useTheme();
    const { t } = useTranslation();
    const [isKitchenEnabled, setIsKitchenEnabled] = React.useState(false);

    React.useEffect(() => {
        const fetchTenantSettings = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.tenantId) {
                try {
                    const data = await tenantService.getById(user.tenantId);
                    setIsKitchenEnabled(data.isKitchenEnabled);
                } catch (err) {
                    console.error('Failed to fetch tenant settings in Sidebar', err);
                }
            }
        };
        fetchTenantSettings();
    }, []);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-100 transition-transform duration-500 ease-out dark:bg-slate-950 dark:border-slate-900 lg:relative lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* Mobile Close Button */}
            <button
                onClick={onClose}
                className="absolute right-[-3rem] top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xl text-slate-900 lg:hidden dark:bg-slate-900 dark:text-white"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="flex h-24 shrink-0 items-center gap-4 px-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                    {branding.logoUrl ? (
                        <img
                            src={branding.logoUrl.startsWith('http') || branding.logoUrl.startsWith('blob:') || branding.logoUrl.startsWith('data:')
                                ? branding.logoUrl
                                : `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}${branding.logoUrl.startsWith('/') ? '' : '/'}${branding.logoUrl}`}
                            alt="Logo"
                            className="h-7 w-auto object-contain"
                        />
                    ) : (
                        <Store className="h-6 w-6" />
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        {branding.companyName || 'BizFlow'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Shop POS
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-6 py-6 overflow-y-auto custom-scrollbar">
                <p className="px-4 mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {t('Menu')}
                </p>
                <div className="space-y-1">
                    {menuItems.filter(item => {
                        // Feature Flag Check
                        if (item.featureFlag === 'isKitchenEnabled' && !isKitchenEnabled) {
                            return false;
                        }

                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const roles = user.roles || [];
                        const permissions = user.permissions || [];
                        const isAdmin = roles.includes('ADMIN');
                        const isOwner = roles.includes('OWNER');
                        const isManager = roles.includes('MANAGER');

                        // 1. If user is ADMIN, only show 'Tenants' and 'Dashboard'
                        if (isAdmin) {
                            return item.path === '/tenants' || item.path === '/dashboard';
                        }

                        // 2. If user is NOT ADMIN, hide 'Tenants'
                        if (item.path === '/tenants') return false;

                        // OWNER Bypass: Owner sees everything
                        if (isOwner) return true;

                        // --- Permission-Based Restriction ---
                        const permissionMapping = {
                            '/customers': 'CUSTOMER_READ',
                            '/invoices': 'INVOICE_READ',
                            '/returns': 'RETURN_READ',
                            '/kitchen-orders': 'KITCHEN_READ'
                        };

                        if (permissionMapping[item.path]) {
                            return permissions.includes(permissionMapping[item.path]);
                        }

                        // --- Role-Based Fallback ---

                        // MANAGER: Inventory and Business Growth
                        const managerPaths = ['/inventory', '/stock-movements', '/suppliers', '/purchases', '/expenses', '/analytics'];
                        if (managerPaths.includes(item.path)) {
                            return isManager;
                        }

                        // Restricted to OWNER only (Owner already bypassed, so others return false)
                        const ownerOnlyPaths = ['/staff', '/logs', '/settings', '/ai-insights', '/dashboard'];
                        if (ownerOnlyPaths.includes(item.path)) {
                            return false;
                        }

                        return true;
                    }).map((item) => (
                        <SidebarItem key={item.path} item={item} />
                    ))}
                </div>
            </nav>

            <div className="p-6">
                <button
                    onClick={() => {
                        authService.logout();
                        navigate('/login', { replace: true });
                    }}
                    className="flex w-full items-center gap-3.5 rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t('Logout')}
                </button>
            </div>
        </aside>
    );
}
