import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import authService from '../services/authService';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({ password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new one.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.password !== passwords.confirm) return setError('Passwords do not match.');
        if (passwords.password.length < 6) return setError('Password must be at least 6 characters.');
        
        setLoading(true);
        setError('');
        try {
            await authService.resetPassword(token, passwords.password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl shadow-blue-500/10 text-center border border-slate-100">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Password reset!</h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        Your password has been successfully updated. <br/>
                        Redirecting you to login...
                    </p>
                    <Link to="/login" className="text-sm font-bold text-blue-600 flex items-center justify-center gap-2">
                        Click here if not redirected <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-blue-500/10 border border-slate-100">
                <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
                    <p className="mt-1 text-sm text-slate-500">Must be at least 6 characters long.</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={passwords.password}
                                onChange={(e) => setPasswords(p => ({...p, password: e.target.value}))}
                                className="block w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 pr-12 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={passwords.confirm}
                            onChange={(e) => setPasswords(p => ({...p, confirm: e.target.value}))}
                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
