import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, Package, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import invoiceService from '../services/invoiceService';
import itemService from '../services/itemService';
import { cn } from '../utils/cn';

/**
 * GlobalSearch – Command palette style search across all modules
 */
export default function GlobalSearch() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search logic
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                // In a real SaaS, this would be a single /search?q=... endpoint
                // For this demo, we search in the most likely modules
                const [customers, invoices, items] = await Promise.all([
                    customerService.getAll(),
                    invoiceService.getAll(),
                    itemService.getAll()
                ]);

                const filtered = [
                    ...customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
                        .map(c => ({ id: c.id, type: 'customer', label: c.name, icon: User, path: `/customers` })),
                    ...invoices.filter(i => (`#INV-${i.id}`).includes(query) || (i.customerName || '').toLowerCase().includes(query.toLowerCase()))
                        .map(i => ({ id: i.id, type: 'invoice', label: `Invoice #INV-${i.id}`, icon: FileText, path: `/invoices/${i.id}` })),
                    ...items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()) || (it.sku || '').includes(query))
                        .map(it => ({ id: it.id, type: 'inventory', label: it.name, icon: Package, path: `/inventory` }))
                ].slice(0, 8); // Keep it snappy

                setResults(filtered);
                setIsOpen(true);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    const handleSelect = (item) => {
        setQuery('');
        setIsOpen(false);
        navigate(item.path);
    };

    return (
        <div className="relative w-full max-w-md" ref={containerRef}>
            {/* Honeypot fields to catch browser autofill */}
            <div style={{ display: 'none' }} aria-hidden="true">
                <input type="text" name="username" tabIndex="-1" />
                <input type="email" name="email" tabIndex="-1" />
                <input type="password" name="password" tabIndex="-1" />
            </div>
            
            <div className={cn(
                "flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all dark:border-slate-800 dark:bg-slate-900/50",
                isOpen && "border-blue-500 ring-2 ring-blue-500/10 bg-white"
            )}>
                <Search size={18} className="text-slate-400" />
                <input
                    type="search"
                    id="bs-qs-55"
                    name="bs-qs-55"
                    placeholder="Search anything (Cmd+K)..."
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 dark:text-white"
                    value={query}
                    readOnly
                    onFocus={(e) => e.target.readOnly = false}
                    autoComplete="one-time-code"
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && <Loader2 size={16} className="animate-spin text-blue-500" />}
                {query && !loading && <X size={16} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setQuery('')} />}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 min-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50">
                    <div className="p-2">
                        {results.map((item) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => handleSelect(item)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    <item.icon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{item.label}</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{item.type}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xl dark:bg-slate-900 dark:border-slate-800 z-50">
                    <p className="text-sm font-medium text-slate-400">No matches found for &quot;{query}&quot;</p>
                </div>
            )}
        </div>
    );
}
