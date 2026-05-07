import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError('Please enter your email address.');
        
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl shadow-blue-500/10 text-center border border-slate-100">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        We&apos;ve sent a password reset link to <br/>
                        <span className="font-semibold text-slate-900">{email}</span>
                    </p>
                    <Link 
                        to="/login" 
                        className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-blue-500/10 border border-slate-100">
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    BACK TO LOGIN
                </Link>

                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <Mail className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
                    <p className="mt-1 text-sm text-slate-500">No worries, we&apos;ll send you reset instructions.</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
