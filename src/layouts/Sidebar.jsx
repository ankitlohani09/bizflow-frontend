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
} from 'lucide-react';
import { cn } from '../utils/cn';
import authService from '../services/authService';

/**
 * Sidebar navigation items
 * Each `path` matches a route in App.jsx.
 * To add a new module: add an entry here AND add a <Route> in App.jsx.
 */
const menuItems = [
    { label: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Analytics',  icon: TrendingUp,       path: '/analytics' },
    { label: 'Customers',  icon: Users,            path: '/customers' },
    { label: 'Suppliers',  icon: Users,            path: '/suppliers' }, // Borrowing icon or use Warehouse
    { label: 'Inventory',  icon: Package,          path: '/inventory' },
    { label: 'Invoices',   icon: FileText,         path: '/invoices' },
    { label: 'Returns',    icon: RotateCcw,        path: '/returns' },
    { label: 'Purchases',  icon: ShoppingCart,     path: '/purchases' },
    { label: 'Expenses',   icon: Wallet,           path: '/expenses' },
    { label: 'Staff',      icon: UserCog,          path: '/staff' },
    { label: 'Settings',   icon: Settings,         path: '/settings' },
];

// ── Single nav item ────────────────────────────────────────────────────────────
// Uses NavLink so React Router marks the link active automatically.
function SidebarItem({ item }) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
                cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                        ? 'bg-white/15 text-white shadow-inner'
                        : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                )
            }
        >
            {({ isActive }) => (
                <>
                    <div className="flex items-center gap-3">
                        <Icon
                            className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive
                                    ? 'text-white'
                                    : 'text-slate-500 group-hover:text-slate-300'
                            )}
                        />
                        <span>{item.label}</span>
                    </div>
                    {/* Active indicator pill */}
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
                </>
            )}
        </NavLink>
    );
}

// ── Sidebar root ───────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    function handleLogout() {
        authService.logout();
        navigate('/login', { replace: true });
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* ── Mobile/Tablet Close Button (Hidden on Desktop) ─────────── */}
            <button 
                onClick={onClose}
                className="absolute right-[-40px] top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white lg:hidden"
            >
                <X className="h-4 w-4" />
            </button>

            {/* ── Brand ──────────────────────────────────────────────────────── */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5 bg-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/20">
                    <Store className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-black leading-none tracking-tight text-white uppercase">
                        BizFlow
                    </p>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Enterprise
                    </p>
                </div>
            </div>

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Main Menu
                </p>
                <div className="space-y-0.5">
                    {menuItems.map((item) => (
                        <SidebarItem key={item.path} item={item} />
                    ))}
                </div>
            </nav>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div className="border-t border-white/10 p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
