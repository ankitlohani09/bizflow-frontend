import React from 'react';
import { Sun, Moon, User, Menu } from 'lucide-react';
import GlobalSearch from '../components/GlobalSearch';
import NotificationCenter from '../components/NotificationCenter';
import { useTheme } from '../context/ThemeContext';

/**
 * Topbar – Global search, notifications, and theme controls
 */
export default function Topbar({ onToggleSidebar }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 dark:border-slate-800 dark:bg-slate-900 transition-colors">
            {/* Left Section: Mobile Menu & Search */}
            <div className="flex flex-1 items-center gap-4">
                <button 
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex-1 max-w-xl">
                    <GlobalSearch />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <NotificationCenter />

                {/* User Profile */}
                <div className="ml-2 flex items-center gap-3 border-l border-slate-100 pl-6 dark:border-slate-800">
                    <div className="flex flex-col text-right">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name || 'User'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.role || 'Staff'}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black">
                        {(user.name || 'U').charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
}
