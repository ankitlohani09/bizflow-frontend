import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    History
} from 'lucide-react';
import { cn } from '../utils/cn';
import authService from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * Sidebar navigation items
 * Each `path` matches a route in App.jsx.
 */
const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'Suppliers', icon: Users, path: '/suppliers' },
    { label: 'Inventory', icon: Package, path: '/inventory' },
    { label: 'Audit Logs', icon: History, path: '/stock-movements' },
    { label: 'Invoices', icon: FileText, path: '/invoices' },
    { label: 'Returns', icon: RotateCcw, path: '/returns' },
    { label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
    { label: 'Expenses', icon: Wallet, path: '/expenses' },
    { label: 'Staff', icon: UserCog, path: '/staff' },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

function SidebarItem({ item }) {
    const Icon = item.icon;
    const { t } = useTranslation();

    return (
        <NavLink
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
                cn(
                    'group relative flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                        ? 'bg-blue-600/10 text-white shadow-soft'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <div className="flex items-center gap-3.5">
                        <Icon
                            className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive
                                    ? 'text-blue-500'
                                    : 'text-slate-500 group-hover:text-slate-300'
                            )}
                        />
                        <span className="tracking-tight">{t(item.label)}</span>
                    </div>
                    {isActive && <div className="sidebar-active-indicator" />}
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { branding } = useTheme();
    const { t } = useTranslation();

    function handleLogout() {
        authService.logout();
        navigate('/login', { replace: true });
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <button
                onClick={onClose}
                className="absolute right-[-40px] top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white lg:hidden"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5 bg-slate-900">
                {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto max-w-[40px] object-contain" />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/20">
                        <Store className="h-4 w-4" />
                    </div>
                )}
                <div>
                    <p className="text-sm font-black leading-none tracking-tight text-white uppercase">
                        {branding.companyName || 'BizFlow'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Enterprise
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-4 py-8 overflow-y-auto custom-scrollbar">
                <p className="px-5 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/50">
                    {t('Main Menu')}
                </p>
                {menuItems.map((item) => (
                    <SidebarItem key={item.path} item={item} />
                ))}
            </nav>

            <div className="border-t border-white/5 p-4">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3.5 rounded-xl px-5 py-4 text-sm font-bold text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                >
                    <LogOut className="h-4 w-4 shrink-0 transition-colors group-hover:text-rose-500" />
                    {t('Logout')}
                </button>
            </div>
        </aside>
    );
}
