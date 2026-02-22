import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        displayName: '',
        email: '',
        password: '',
        passwordConfirm: '',
        location: '',
        phoneNumber: '',
        communityReference: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false); // Track successful signup to show pending message

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => navigate('/archive'), 2000);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);


    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (form.password !== form.passwordConfirm) {
            return setError('Passwords do not match');
        }

        if (!form.communityReference.trim()) {
            return setError('Please provide a community reference (Family House or Neighborhood).');
        }

        try {
            setError('');
            setLoading(true);
            await signup(
                form.email,
                form.password,
                form.displayName,
                form.location,
                form.phoneNumber,
                form.communityReference
            );
            setSuccess(true); // Show success message instead of redirecting immediately
        } catch (err) {
            console.error(err);
            setError('Failed to create an account. ' + err.message);
            setLoading(false);
        }
    }

    if (success) {

        return (
            <div className="min-h-screen bg-forest-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-forest-100 p-8 text-center">
                    <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🕌</span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-forest-900 mb-4">
                        Registration Successful ✅
                    </h2>
                    <p className="text-forest-700 leading-relaxed mb-4">
                        Welcome to WOLO! Your account has been created.
                    </p>
                    <p className="text-forest-500 text-sm mb-8">
                        Redirecting to the Tribute Wall...
                    </p>
                    <Link
                        to="/archive"
                        className="block w-full py-3 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-colors shadow-md"
                    >
                        Go to Tribute Wall →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-forest-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-block text-4xl mb-4">🌙</Link>
                    <h2 className="font-heading text-3xl font-bold text-forest-900">
                        Join the Community
                    </h2>
                    <p className="mt-2 text-forest-600">
                        Create an account to honor your loved ones
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-forest-100 sm:px-10">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Display Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-semibold text-forest-900 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                required
                                value={form.displayName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                                placeholder="e.g. Amina Suleman"
                            />
                        </div>

                        {/* Community Reference */}
                        <div>
                            <label htmlFor="communityReference" className="block text-sm font-semibold text-forest-900 mb-1">
                                Community Reference <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="communityReference"
                                name="communityReference"
                                type="text"
                                required
                                value={form.communityReference}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                                placeholder="e.g. Family House Name or Neighborhood"
                            />
                            <p className="mt-1 text-xs text-forest-500">Required for verification.</p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-forest-900 mb-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                required
                                value={form.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                                placeholder="e.g. 054 123 4567"
                            />
                            <p className="mt-1 text-xs text-forest-500">For admin contact if needed.</p>
                        </div>

                        {/* Location (Optional) */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-forest-900 mb-1">
                                Location (Optional)
                            </label>
                            <input
                                id="location"
                                name="location"
                                type="text"
                                value={form.location}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                                placeholder="e.g. Accra, Ghana"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-forest-900 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-forest-900 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all pr-12"
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

                        {/* Password Confirm */}
                        <div>
                            <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-forest-900 mb-1">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    type={showPasswordConfirm ? 'text' : 'password'}
                                    required
                                    value={form.passwordConfirm}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-600/50 hover:text-forest-700 transition-colors"
                                >
                                    {showPasswordConfirm ? (
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-base font-bold text-cream-100 bg-forest-800 hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-cream-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-forest-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-forest-800 hover:text-cream-400 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
