import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            // ActionCodeSettings: redirect back to login after password reset
            const actionCodeSettings = {
                url: 'https://wolo-5fbcd.web.app/login',
                handleCodeInApp: false,
            };

            await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
            setSuccess(true);
        } catch (err) {
            console.log('🔑 Password reset error code:', err.code);
            console.log('🔑 Password reset error message:', err.message);
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('Account not found. Please check the email address and try again.');
                    break;
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/missing-email':
                    setError('Please enter your email address.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many attempts. Please try again later.');
                    break;
                case 'auth/network-request-failed':
                    setError('Network error. Please check your connection and try again.');
                    break;
                case 'auth/internal-error':
                    setError('Firebase internal error. Please try again in a moment.');
                    break;
                default:
                    setError(`Reset failed (${err.code || 'unknown'}): ${err.message || 'Please try again.'}`);
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
                        <svg className="w-7 h-7 text-cream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-forest-900">
                        Reset Password
                    </h1>
                    <p className="text-forest-700/70 mt-1">
                        Enter your email and we'll send you a reset link
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-6 sm:p-8">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="font-heading text-lg font-semibold text-forest-900 mb-2">
                                Check your email!
                            </h2>
                            <p className="text-forest-700/70 text-sm mb-4">
                                The <strong className="text-forest-900">Kamgbunli Digital Sanctuary</strong> has sent a password reset link to <strong className="text-forest-900">{email}</strong>.
                            </p>
                            <p className="text-forest-700/70 text-xs mb-6 bg-cream-200/60 rounded-lg px-3 py-2">
                                ⚠️ Can't find it? Check your <strong>Spam</strong> or <strong>Junk</strong> folder and look for an email from <strong>noreply@wolo-5fbcd.firebaseapp.com</strong>.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-colors shadow-md"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                                    <span className="text-lg">❌</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-semibold text-forest-900 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-forest-800 text-cream-100 font-bold text-base hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-sm text-forest-700/70">
                                Remember your password?{' '}
                                <Link to="/login" className="text-forest-800 font-semibold hover:text-cream-400 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </>
                    )}

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
