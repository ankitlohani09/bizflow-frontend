import React from 'react';
import { Sun, Moon, User, Menu, Maximize, Minimize, ChevronDown, ShieldCheck, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from '../components/GlobalSearch';
import NotificationCenter from '../components/NotificationCenter';
import { useTheme } from '../context/ThemeContext';
import i18n from '../i18n';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { cn } from '../utils/cn';

/**
 * Modernized Topbar with glassmorphism and refined profile section
 */
export default function Topbar({ onToggleSidebar }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);
    const [showLangMenu, setShowLangMenu] = React.useState(false);
    const menuRef = React.useRef(null);
    const langMenuRef = React.useRef(null);
    const [user, setUser] = React.useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    // Listen for user updates without page reload
    React.useEffect(() => {
        const handleUserUpdate = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };
        window.addEventListener('user-updated', handleUserUpdate);
        return () => window.removeEventListener('user-updated', handleUserUpdate);
    }, []);

    // Click outside handler
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        
        // Google Translate Cookie
        const value = `/en/${lng}`;
        document.cookie = `googtrans=${value}; path=/;`;
        
        // Reload to apply translation
        window.location.reload();
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-100 bg-white/80 px-6 backdrop-blur-xl dark:border-slate-900 dark:bg-slate-950/80 transition-all duration-300">
            {/* Left Section: Mobile Menu & Search */}
            <div className="flex flex-1 items-center gap-6">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleSidebar}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:hidden dark:bg-slate-900 dark:text-slate-400"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="h-5 w-5" />
                </motion.button>
                <div className="flex-1 max-w-xl">
                    <GlobalSearch />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </motion.button>

                {/* Full Screen Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFullScreen}
                    className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-all hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </motion.button>

                {/* Language Switcher */}
                <div className="relative" ref={langMenuRef}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="h-10 rounded-xl bg-slate-50 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 focus:outline-none transition-all"
                    >
                        {i18n.language.toUpperCase()}
                        <ChevronDown size={12} className={cn("text-slate-400 transition-transform duration-300", showLangMenu && "rotate-180")} />
                    </motion.button>

                    <AnimatePresence>
                        {showLangMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute right-0 mt-2 w-32 rounded-2xl bg-white p-1.5 shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-900 z-50"
                            >
                                <div className="space-y-0.5">
                                    {[
                                        { key: 'en', label: 'English' },
                                        { key: 'hi', label: 'Hindi' }
                                    ].map((lang) => (
                                        <button
                                            key={lang.key}
                                            onClick={() => { changeLanguage(lang.key); setShowLangMenu(false); }}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[11px] font-bold tracking-wide transition-all",
                                                i18n.language === lang.key
                                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <span>{lang.label}</span>
                                            {i18n.language === lang.key && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-[1px] bg-slate-100 dark:bg-slate-900 mx-2" />

                {/* Notifications */}
                <NotificationCenter />

                {/* User Profile */}
                <div className="relative" ref={menuRef}>
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="ml-2 flex items-center gap-3 pl-4 py-1.5 pr-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300"
                    >
                        <div className="hidden flex-col text-right sm:flex">
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                {user.name || '--'}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                {user.roles && user.roles.length > 0 ? user.roles[0] : 'Member'}
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black text-sm ring-4 ring-indigo-500/10 transition-transform group-hover:scale-105 overflow-hidden">
                            {user.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : (import.meta.env.VITE_API_URL) + user.profilePictureUrl}
                                    className="h-full w-full object-cover"
                                    alt="Avatar"
                                />
                            ) : (
                                (user.name || 'A').charAt(0)
                            )}
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", showProfileMenu && "rotate-180")} />
                    </motion.button>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute right-0 mt-4 w-80 rounded-3xl bg-white p-2 shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-900"
                            >
                                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 mb-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">Signed in as</p>
                                    <p className={cn(
                                        "font-black text-slate-900 dark:text-white truncate",
                                        (user.email || '').length > 25 ? "text-xs" : "text-sm"
                                    )}>{user.email || '--'}</p>
                                </div>

                                <div className="space-y-1">
                                    <button
                                        onClick={() => { navigate('/settings', { state: { tab: 'account' } }); setShowProfileMenu(false); }}
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-primary transition-all"
                                    >
                                        <User size={18} />
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => { navigate('/settings', { state: { tab: 'security' } }); setShowProfileMenu(false); }}
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-primary transition-all"
                                    >
                                        <ShieldCheck size={18} />
                                        Security
                                    </button>
                                    {(user.roles?.includes('MANAGER') || user.roles?.includes('OWNER')) && (
                                        <button
                                            onClick={() => { navigate('/settings', { state: { tab: 'branding' } }); setShowProfileMenu(false); }}
                                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-indigo-400 transition-all"
                                        >
                                            <Settings size={18} />
                                            Shop Settings
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-900">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
