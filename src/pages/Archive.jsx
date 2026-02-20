import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function Archive() {
    const { currentUser } = useAuth();

    const [memorials, setMemorials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedYear, setSelectedYear] = useState('All');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'az' | 'za'

    // Debounce search term (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Available years for dropdown
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    useEffect(() => {
        setLoading(true);

        // Query: only approved memorials — NO orderBy to avoid composite index requirement
        const q = query(
            collection(db, 'memorials'),
            where('isApproved', '==', true)
        );

        // Real-time listener — new posts appear instantly
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMemorials(data);
            setLoading(false);
        }, (err) => {
            console.error('Error listening to memorials:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Protected Route: Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Memoized filtered + sorted result (sorting done client-side to avoid composite index)
    const filteredMemorials = memorials.filter(m => {
        // 1. Year Filter
        if (selectedYear !== 'All') {
            if (!m.dateOfPassing || !m.dateOfPassing.startsWith(String(selectedYear))) return false;
        }
        // 2. Search Filter (Name or Family House)
        if (debouncedSearch.trim()) {
            const lowerSearch = debouncedSearch.toLowerCase();
            const matchesName = m.fullName?.toLowerCase().includes(lowerSearch);
            const matchesHouse = m.familyHouse?.toLowerCase().includes(lowerSearch);
            if (!matchesName && !matchesHouse) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortOrder === 'newest') {
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        } else if (sortOrder === 'oldest') {
            return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        } else if (sortOrder === 'az') {
            return (a.fullName || '').localeCompare(b.fullName || '');
        } else if (sortOrder === 'za') {
            return (b.fullName || '').localeCompare(a.fullName || '');
        }
        return 0;
    });

    async function handleShare() {
        const shareData = {
            title: 'WOLO: Kamgbunli Legacy Archive',
            text: 'Visit the Kamgbunli Legacy Tribute Wall — remembering our community members.',
            url: window.location.origin + '/archive',
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!');
            } else {
                // Fallback for older browsers without Clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = shareData.url;
                textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    }

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col">

            {/* Compact title strip */}
            <div className="bg-forest-900 py-4 text-center">
                <p className="font-arabic text-cream-400/70 text-xs mb-0.5">
                    إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                </p>
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-cream-100">
                    Tribute Wall
                </h1>
                {!loading && (
                    <p className="text-cream-300/70 text-sm mt-1">
                        <span className="font-bold text-cream-200">{memorials.length}</span> {memorials.length === 1 ? 'Tribute' : 'Tributes'}
                    </p>
                )}
            </div>

            {/* Memorial Grid / Status — MAIN CONTENT AREA (grows to fill) */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-12 h-12 mb-3">
                                <div className="absolute inset-0 border-4 border-forest-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-forest-700 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-forest-700 font-medium">Loading memorials...</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filteredMemorials.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-cream-200">
                            {debouncedSearch || selectedYear !== 'All' ? (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-cream-300 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-7 h-7 text-forest-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-heading text-lg font-semibold text-forest-900 mb-1">
                                        No memorials found
                                    </h3>
                                    <p className="text-forest-600 text-sm mb-3">
                                        {debouncedSearch && selectedYear !== 'All'
                                            ? `No results for "${debouncedSearch}" in ${selectedYear}`
                                            : debouncedSearch
                                                ? `No results for "${debouncedSearch}"`
                                                : `No memorials from ${selectedYear}`
                                        }
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setDebouncedSearch('');
                                            setSelectedYear('All');
                                        }}
                                        className="px-4 py-2 rounded-xl bg-forest-800 text-cream-100 hover:bg-forest-700 transition-colors font-medium text-sm"
                                    >
                                        Clear Filters
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-cream-300 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">🕌</span>
                                    </div>
                                    <h3 className="font-heading text-lg font-semibold text-forest-900 mb-1">
                                        No memorials yet
                                    </h3>
                                    <p className="text-forest-600 text-sm">
                                        Be the first to honor a loved one.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Memorial Grid */}
                    {!loading && filteredMemorials.length > 0 && (
                        <>
                            <p className="text-sm text-forest-700/50 mb-4 font-medium">
                                Showing {filteredMemorials.length} memorial{filteredMemorials.length !== 1 ? 's' : ''}
                                {selectedYear !== 'All' && ` from ${selectedYear}`}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                                {filteredMemorials.map((memorial) => (
                                    <TributeCard
                                        key={memorial.id}
                                        memorial={memorial}

                                        isLoggedIn={!!currentUser}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Search & Filter Bar — FIXED AT BOTTOM */}
            <div className="sticky bottom-0 bg-forest-900 border-t border-forest-700 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
                <div className="max-w-5xl mx-auto px-3 py-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">

                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search name or family house..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 rounded-lg bg-forest-800 text-cream-100 placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-cream-400 border border-forest-700 text-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setDebouncedSearch('');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-500 hover:text-cream-400 transition-colors"
                                    title="Clear search"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Year & Sort row */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="flex-1 sm:w-32 px-3 py-2 rounded-lg bg-forest-800 text-cream-100 border border-forest-700 focus:outline-none focus:ring-2 focus:ring-cream-400 text-sm"
                            >
                                <option value="All">All Years</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="flex-1 sm:w-40 px-3 py-2 rounded-lg bg-forest-800 text-cream-100 border border-forest-700 focus:outline-none focus:ring-2 focus:ring-cream-400 text-sm"
                            >
                                <option value="newest">Recent</option>
                                <option value="oldest">Oldest</option>
                                <option value="az">A-Z</option>
                                <option value="za">Z-A</option>
                            </select>
                            <button
                                onClick={handleShare}
                                className="px-3 py-2 rounded-lg bg-cream-400/20 text-cream-100 hover:bg-cream-400/30 transition-colors border border-cream-400/30"
                                title="Share WOLO"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper: Optimize image URL for speed (WebP/Auto)
function optimizeImage(url) {
    if (!url || !url.includes('cloudinary.com')) return url;
    // If it already has transformation, maybe replace it, but usually standard upload just has /upload/v...
    // Insert f_auto,q_auto after /upload/
    if (url.includes('/upload/') && !url.includes('f_auto,q_auto')) {
        return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    return url;
}

// Resolve the list of images, supporting both old `imageUrl` and new `imageUrls` fields
function getImageList(memorial) {
    if (memorial.imageUrls && memorial.imageUrls.length > 0) {
        return memorial.imageUrls;
    }
    if (memorial.imageUrl) {
        return [memorial.imageUrl];
    }
    return [];
}

function TributeCard({ memorial, isLoggedIn }) {
    const { id, fullName, familyHouse, audioTributeUrl } = memorial;
    const images = getImageList(memorial);
    const hasMultipleImages = images.length > 1;

    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef(null);

    function handlePrev(e) {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }

    function handleNext(e) {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }

    function handleTouchStart(e) {
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swiped left → next
                setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            } else {
                // Swiped right → prev
                setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }
        }
        touchStartX.current = null;
    }

    const optimizedImageUrl = images.length > 0 ? optimizeImage(images[activeIndex]) : null;

    return (
        <Link
            to={`/memorial/${id}`}
            className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-cream-200 group"
        >
            <div
                className="h-56 bg-forest-200 overflow-hidden relative"
                onTouchStart={hasMultipleImages ? handleTouchStart : undefined}
                onTouchEnd={hasMultipleImages ? handleTouchEnd : undefined}
            >
                {optimizedImageUrl ? (
                    <img
                        src={optimizedImageUrl}
                        alt={fullName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-300 to-forest-600">
                        <span className="text-6xl font-heading font-bold text-white/30">
                            {fullName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    </div>
                )}

                {/* Gallery navigation arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Next image"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dot indicators */}
                {hasMultipleImages && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                            <span
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}



                {/* Audio tribute indicator */}
                {audioTributeUrl && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-cream-100 text-xs flex items-center gap-1">
                        <span>🎙️</span>
                        <span className="hidden sm:inline text-[10px]">Voice</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <h3 className="font-heading text-lg font-semibold text-forest-900 truncate mb-1">
                    {fullName}
                </h3>
                {memorial.dateOfPassing && (
                    <p className="text-xs text-forest-600/70 mb-1">
                        Passed: {memorial.dateOfPassing}
                    </p>
                )}
                {familyHouse && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-cream-200 text-forest-800 text-xs font-medium mb-2">
                        🏠 {familyHouse}
                    </span>
                )}
                {(memorial.postedByName || memorial.postedByEmail) && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <svg className="w-3.5 h-3.5 text-forest-600/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-xs font-medium text-forest-700/80 truncate">
                            Posted by {memorial.postedByName || memorial.postedByEmail}
                        </p>
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-cream-200 mt-3">
                    <span className="text-xs font-semibold text-forest-700 ml-auto">
                        View Details &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
}
