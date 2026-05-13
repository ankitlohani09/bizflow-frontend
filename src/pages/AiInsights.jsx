import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Send,
    TrendingUp,
    ShoppingCart,
    BrainCircuit,
    Lightbulb,
    ArrowUpRight,
    MessageSquare,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aiService from '../services/aiService';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/formatCurrency';

export default function AiInsights() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { type: 'ai', text: 'Hello! I am BizFlow AI. How can I help you with your business data today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [isAiEnabled, setIsAiEnabled] = useState(localStorage.getItem('ai_enabled') !== 'false');

    useEffect(() => {
        const handleSettingChange = () => {
            setIsAiEnabled(localStorage.getItem('ai_enabled') !== 'false');
        };
        window.addEventListener('ai-setting-changed', handleSettingChange);
        return () => window.removeEventListener('ai-setting-changed', handleSettingChange);
    }, []);
    const [suggestions, setSuggestions] = useState([]);
    const [trends, setTrends] = useState([]);

    useEffect(() => {
        const fetchAIPredictions = async () => {
            try {
                const [reorderData, trendsData] = await Promise.all([
                    aiService.getReorderSuggestions(),
                    aiService.getSeasonalTrends()
                ]);
                setSuggestions(reorderData || []);
                setTrends(trendsData || []);
            } catch (error) {
                console.error('Failed to fetch AI insights:', error);
            }
        };
        fetchAIPredictions();
    }, []);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg = { type: 'user', text: query };
        setChatHistory(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const response = await aiService.query(query);
            setChatHistory(prev => [...prev, { type: 'ai', text: response.answer || response.response || 'I processed your request, but I am unable to provide a specific answer right now.' }]);
        } catch {
            setChatHistory(prev => [...prev, { type: 'ai', text: 'Sorry, I encountered an error while processing your request. Please try again later.' }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (text) => {
        if (!text) return '';
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (!isAiEnabled) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Insights is Disabled</h1>
                <p className="text-slate-500 mb-6 max-w-md">You can enable AI-powered business chat and predictions in the Settings page.</p>
                <button
                    onClick={() => navigate('/settings', { state: { tab: 'master' } })}
                    className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                    Go to Settings
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-[calc(100vh-100px)]">
            {/* Left Column: AI Chat & Quick Actions */}
            <div className="xl:col-span-2 flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Sparkles className="text-primary animate-pulse" size={32} />
                            {t('AI Insights')}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Chat with your business data and get smart predictions.</p>
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <BrainCircuit size={20} className="text-primary" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">Smart Analysis Bot</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Online</span>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[500px]">
                        <AnimatePresence>
                            {chatHistory.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "flex gap-4 max-w-[80%]",
                                        msg.type === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center",
                                        msg.type === 'user' ? "bg-slate-900" : "bg-primary"
                                    )}>
                                        {msg.type === 'user' ? <MessageSquare size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-3xl text-sm font-medium leading-relaxed",
                                        msg.type === 'user'
                                            ? "bg-slate-900 text-white rounded-tr-none"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                                    )}>
                                        {renderMessage(msg.text)}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary flex items-center justify-center">
                                        <Loader2 size={18} className="text-white animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-3xl rounded-tl-none bg-slate-100 dark:bg-slate-800 flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Ask about sales, stock, or growth trends..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 pr-16 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all dark:text-white"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !query.trim()}
                                className="absolute right-2 h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: AI Recommendations Cards */}
            <div className="space-y-8">
                {/* Reorder Suggestions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Smart Reorder</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predictive Inventory</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {suggestions.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No items currently identified for reordering.</p>
                        ) : suggestions.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-amber-200 transition-all">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{item.itemName}</p>
                                    <p className="text-xs text-slate-500">Predicted out in {item.predictedDays || '3'} days</p>
                                </div>
                                <ArrowUpRight size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seasonal Trends */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <TrendingUp size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black">Market Trends</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Growth Insights</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {trends.length === 0 ? (
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Lightbulb size={18} className="text-indigo-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
                                    </div>
                                    <p className="text-sm text-white/70 leading-relaxed">
                                        &quot;Seasonal analysis shows increased demand for cold beverages expected next week as temperatures rise.&quot;
                                    </p>
                                </div>
                            ) : trends.map((trend, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                        <p className="text-sm font-medium text-white/80">{trend.period}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white">{trend.sales !== undefined ? formatCurrency(trend.sales) : ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
