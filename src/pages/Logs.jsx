import React, { useState, useEffect, useCallback } from 'react';
import {
    Terminal,
    User,
    Activity,
    BrainCircuit,
    Search,
    Filter,
    Download,
    Eye,
    Clock,
    ArrowLeft,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logService from '../services/logService';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import Pagination from '../components/ui/Pagination';

// Using native Intl.DateTimeFormat instead of date-fns to avoid dependency issues in dev server
const formatDate = (dateStr, formatType) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (formatType === 'dd MMM, HH:mm') {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }
    if (formatType === 'yyyy') {
        return date.getFullYear();
    }
    return date.toLocaleString();
};

const formatAction = (action) => {
    const mapping = {
        'UPDATE_TENANT': 'Update Settings',
        'LOGIN': 'Login',
        'UPDATE_PASSWORD': 'Change Password'
    };
    return mapping[action] || action;
};

const formatEntity = (entity) => {
    const mapping = {
        'TENANT': 'Business',
        'USER': 'User'
    };
    return mapping[entity] || entity;
};

export default function Logs() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ACTIVITY');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [filterAction, setFilterAction] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const data = activeTab === 'ACTIVITY'
                ? await logService.getActivityLogs()
                : await logService.getAiLogs();
            setLogs(data || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, filterAction]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (log.action || log.query || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (log.userName || log.entityType || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterAction === '' || log.action === filterAction;
        return matchesSearch && matchesFilter;
    });

    // Paginated results
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = () => {
        const headers = ["Timestamp", "User", "Action & Entity", "Details"];
        const rows = filteredLogs.map(log => [
            log.createdAt || log.timestamp,
            log.userName || (log.userId ? `User #${log.userId}` : 'System'),
            activeTab === 'ACTIVITY' ? `${formatAction(log.action)} on ${formatEntity(log.entityType)}` : log.prompt,
            log.description || log.response || 'N/A'
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `logs_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-12 w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Terminal className="text-primary" size={32} />
                            {t('System Logs')}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Audit user activities and AI interactions.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            onClick={() => setActiveTab('ACTIVITY')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                activeTab === 'ACTIVITY'
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <Activity size={14} />
                            Activity Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('AI')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                activeTab === 'AI'
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <BrainCircuit size={14} />
                            AI Interactions
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by action, user, or entity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select 
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="flex-1 md:flex-none h-12 px-6 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-800 hover:bg-slate-100 transition-all outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="UPDATE_PASSWORD">Password Change</option>
                        <option value="UPDATE_TENANT">Settings Update</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-none h-12 px-6 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Table / List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {activeTab === 'ACTIVITY' ? 'Action & Entity' : 'AI Query'}
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6 h-20">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <Terminal className="text-slate-200 dark:text-slate-800" size={64} />
                                            <p className="text-slate-500 font-bold mt-4">No logs found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <Clock size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {(log.createdAt || log.timestamp) ? formatDate(log.createdAt || log.timestamp, 'dd MMM, HH:mm') : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {log.userName ? log.userName.charAt(0) : (log.userId ? 'U' : <User size={14} />)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    {log.userName || (log.userId ? `User #${log.userId}` : 'System')}
                                                    {log.userRole && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md">
                                                              {log.userRole}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {activeTab === 'ACTIVITY' ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatAction(log.action)} <span className="text-slate-400 font-medium">on</span> {formatEntity(log.entityType)}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-500">ID: {log.entityId || 'N/A'}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                                                    &quot;{log.prompt || log.query}&quot;
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer / Pagination */}
                {!loading && filteredLogs.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredLogs.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Log Details</h3>
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase text-slate-400">User</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {selectedLog.userName || (selectedLog.userId ? `User #${selectedLog.userId}` : 'System')}
                                    {selectedLog.userRole && (
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md">
                                            {selectedLog.userRole}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase text-slate-400">Action</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatAction(selectedLog.action)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase text-slate-400">Entity</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatEntity(selectedLog.entityType)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black uppercase text-slate-400">Entity ID</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.entityId || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-black uppercase text-slate-400">Description</span>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                    {selectedLog.description || 'No description'}
                                </p>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 pt-2">
                                <span className="text-xs font-black uppercase text-slate-400">IP Address</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedLog.ipAddress || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
