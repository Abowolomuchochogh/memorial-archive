import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await login(email, password);
            setSuccess(true);
            setTimeout(() => navigate('/archive'), 500);
        } catch (err) {
            console.error('Login error:', err);
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email. Please sign up first.');
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid email or password. If you don\'t have an account, please sign up.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many attempts. Please try again later.');
                    break;
                default:
                    setError('Failed to sign in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await signInWithGoogle();
            setSuccess(true);
            setTimeout(() => navigate('/archive'), 500);
        } catch (err) {
            console.error('Google Sign-In error:', err);
            switch (err.code) {
                case 'auth/popup-closed-by-user':
                    setError('Sign-in popup was closed. Please try again.');
                    break;
                case 'auth/popup-blocked':
                    setError('Popup was blocked by your browser. Please allow popups and try again.');
                    break;
                case 'auth/account-exists-with-different-credential':
                    setError('An account already exists with this email using a different sign-in method.');
                    break;
                case 'auth/network-request-failed':
                    setError('Network error. Please check your connection and try again.');
                    break;
                case 'auth/cancelled-popup-request':
                    setError('Another sign-in popup is already open. Please close it and try again.');
                    break;
                default:
                    setError(`Google Sign-In failed: ${err.message || 'Unknown error. Please try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-forest-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-cream-400 font-heading font-bold text-2xl">K</span>
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-forest-900">
                        Welcome Back
                    </h1>
                    <p className="text-forest-700/70 mt-1">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-6 sm:p-8">
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>Sign in successful! Redirecting...</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <span className="text-lg">❌</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-forest-900 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-forest-900 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-600/50 hover:text-forest-700 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-forest-800 text-cream-100 font-bold text-base hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <div className="text-center mt-3">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-forest-700/70 hover:text-forest-900 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-cream-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-forest-700/70">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign-In */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-white text-forest-900 font-semibold text-base border-2 border-cream-300 hover:border-forest-400 hover:bg-cream-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <p className="mt-6 text-center text-sm text-forest-700/70">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-forest-800 font-semibold hover:text-cream-400 transition-colors">
                            Sign Up
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-xs text-forest-600/50">
                        Still having trouble?{' '}
                        <a
                            href="mailto:abowolomuchochogh@gmail.com?subject=WOLO%20Sanctuary%20Support%20Request"
                            className="text-forest-700/60 hover:text-forest-900 underline underline-offset-2 transition-colors"
                        >
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
