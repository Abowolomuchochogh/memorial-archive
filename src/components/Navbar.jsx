import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { currentUser, userProfile, logout, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Derive display name from Firestore profile, then Firebase Auth, then email fallback
    const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User';

    const links = [
        { name: 'Home', path: '/' },
        { name: 'Tribute Wall', path: '/archive' },
        ...(isAdmin ? [{ name: 'Dashboard', path: '/admin-dashboard' }] : []),
    ];

    // Listen for unread notifications in real-time
    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        }, (err) => {
            console.error('Notification count listener error:', err);
        });

        return () => unsubscribe();
    }, [currentUser]);

    async function handleLogout() {
        try {
            setIsOpen(false);
            navigate('/', { replace: true });
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    // Bell icon component
    function BellIcon({ className = '' }) {
        return (
            <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className={`relative ${className}`}
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Link>
        );
    }

    return (
        <nav className="bg-forest-900 text-cream-100 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-wide">
                        <span className="text-2xl">🌙</span>
                        <span>Kamgbunli Legacy</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-cream-400 ${location.pathname === link.path ? 'text-cream-400' : 'text-cream-100/80'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/upload"
                                    className="px-4 py-2 rounded-lg bg-cream-400 text-forest-900 font-semibold text-sm hover:bg-cream-300 transition-colors"
                                >
                                    Submit Memorial
                                </Link>

                                {/* Bell Icon */}
                                <BellIcon className="text-cream-100/80 hover:text-cream-100 transition-colors" />

                                {/* User identity block */}
                                <div className="flex items-center gap-2 pl-3 border-l border-cream-100/20">
                                    {/* Avatar circle */}
                                    <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-cream-200 text-xs font-bold uppercase flex-shrink-0">
                                        {displayName.charAt(0)}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-cream-100 max-w-[120px] truncate">
                                                {displayName}
                                            </span>
                                            {isAdmin && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 leading-none">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="text-xs text-cream-100/50 hover:text-cream-100 transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-cream-100/80 hover:text-white"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 rounded-lg bg-forest-700 text-cream-100 font-semibold text-sm hover:bg-forest-600 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile: bell + hamburger */}
                    <div className="md:hidden flex items-center gap-3">
                        {currentUser && (
                            <BellIcon className="text-cream-100/80 hover:text-cream-100 transition-colors" />
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-cream-100 hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-forest-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {/* User identity section (mobile) */}
                        {currentUser && (
                            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-forest-900/50 border border-forest-700">
                                <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-cream-200 text-sm font-bold uppercase flex-shrink-0">
                                    {displayName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold text-cream-100 truncate">
                                            {displayName}
                                        </span>
                                        {isAdmin && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 leading-none flex-shrink-0">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-cream-100/40 truncate">{currentUser.email}</p>
                                </div>
                            </div>
                        )}

                        {links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === link.path
                                    ? 'bg-forest-900 text-cream-400'
                                    : 'text-cream-100 hover:bg-forest-700'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {currentUser && (
                            <Link
                                to="/notifications"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/notifications'
                                    ? 'bg-forest-900 text-cream-400'
                                    : 'text-cream-100 hover:bg-forest-700'
                                    }`}
                            >
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {currentUser ? (
                            <>
                                <Link
                                    to="/upload"
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-cream-400 hover:bg-forest-700"
                                >
                                    Submit Memorial
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-cream-100/60 hover:bg-forest-700 hover:text-cream-100 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-cream-100 hover:bg-forest-700"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-cream-400 hover:bg-forest-700"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
