import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import { useTheme } from '../context/ThemeContext';

/**
 * Login Page
 *
 * Calls POST /auth/login → saves JWT → redirects to /dashboard
 *
 * Fields:
 *   email    – user email
 *   password – user password
 *   tenantId – optional; leave blank for single-tenant setups
 */
export default function Login() {
    const navigate = useNavigate();
    const { refreshBranding } = useTheme();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(''); // clear error on any key stroke
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await authService.login(form.email, form.password);
            await refreshBranding();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            // err.message is already human-readable (set in api.js interceptor)
            setError(err.message ?? 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            {/* Card */}
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

                {/* Brand */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                        <Store className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome to BizFlow</h1>
                    <p className="mt-1 text-sm text-slate-500">Sign in to access your business dashboard</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@company.com"
                            disabled={loading}
                            className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-[14px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                disabled={loading}
                                className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-[14px] text-slate-400">
                    &copy; {new Date().getFullYear()} BizFlow Enterprise. All rights reserved.
                </p>
            </div>
        </div>
    );
}
