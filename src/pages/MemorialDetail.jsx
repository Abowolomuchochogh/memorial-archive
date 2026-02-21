import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

// Helper: Optimize image URL for speed (WebP/Auto)
function optimizeImage(url) {
    if (!url || !url.includes('cloudinary.com')) return url;
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

export default function MemorialDetail() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [memorial, setMemorial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState(false);

    // Gallery state
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => {
        async function fetchMemorial() {
            try {
                const snap = await getDoc(doc(db, 'memorials', id));
                if (snap.exists()) {
                    setMemorial({ id: snap.id, ...snap.data() });
                }
            } catch (err) {
                console.error('Error fetching memorial:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchMemorial();
    }, [id]);



    async function handleMessageFamily() {
        if (!currentUser || !memorial) return;

        const posterUid = memorial.postedBy;
        if (posterUid === currentUser.uid) return;

        setStartingChat(true);
        try {
            // Check if a chat already exists between these two users
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
            const snapshot = await getDocs(q);

            let existingChatId = null;
            snapshot.docs.forEach((d) => {
                const data = d.data();
                if (data.participants.includes(posterUid)) {
                    existingChatId = d.id;
                }
            });

            if (existingChatId) {
                navigate(`/chat/${existingChatId}`);
            } else {
                // Create a new chat
                const newChat = await addDoc(chatsRef, {
                    participants: [currentUser.uid, posterUid],
                    participantNames: {
                        [currentUser.uid]: currentUser.displayName || currentUser.email,
                        [posterUid]: 'Family Member',
                    },
                    memorialId: id,
                    memorialName: memorial.fullName,
                    lastMessage: '',
                    lastMessageAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });
                navigate(`/chat/${newChat.id}`);
            }
        } catch (err) {
            console.error('Error starting chat:', err);
        } finally {
            setStartingChat(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-forest-300 border-t-forest-700 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-forest-700">Loading memorial...</p>
                </div>
            </div>
        );
    }

    if (!memorial) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-heading text-2xl font-bold text-forest-900 mb-2">Memorial Not Found</h2>
                    <p className="text-forest-700/70 mb-6">This memorial may have been removed.</p>
                    <Link to="/archive" className="px-6 py-2.5 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-colors">
                        Back to Tribute Wall
                    </Link>
                </div>
            </div>
        );
    }

    const { fullName, dateOfPassing, biography, postedBy, audioTributeUrl } = memorial;
    const isOwnPost = currentUser?.uid === postedBy;
    const images = getImageList(memorial);
    const hasMultipleImages = images.length > 1;
    const currentImage = images.length > 0 ? optimizeImage(images[activeImageIndex]) : null;

    function handleGalleryPrev() {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }

    function handleGalleryNext() {
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }

    function handleTouchStart(e) {
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) handleGalleryNext();
            else handleGalleryPrev();
        }
        touchStartX.current = null;
    }

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Hero image section with gallery */}
            <div
                className="relative h-72 sm:h-80 lg:h-[28rem] bg-[#0a0f0d] overflow-hidden group"
                onTouchStart={hasMultipleImages ? handleTouchStart : undefined}
                onTouchEnd={hasMultipleImages ? handleTouchEnd : undefined}
            >
                {currentImage ? (
                    <img src={currentImage} alt={fullName} className="w-full h-full object-cover transition-opacity duration-300 relative z-10" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-forest-800 to-forest-900 flex items-center justify-center">
                        <span className="text-[120px] font-heading font-bold text-white/10">
                            {fullName?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                )}
                {/* Background blur effect for containment (fallback/aesthetic) */}
                {currentImage && (
                    <img src={currentImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md scale-110" aria-hidden="true" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>

                {/* Gallery arrows */}
                {hasMultipleImages && (
                    <>
                        <button
                            onClick={handleGalleryPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-30"
                            aria-label="Previous image"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleGalleryNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-30"
                            aria-label="Next image"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Gallery dot indicators */}
                {hasMultipleImages && (
                    <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeImageIndex
                                    ? 'bg-white scale-110'
                                    : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                aria-label={`View image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Image counter badge */}
                {hasMultipleImages && (
                    <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-cream-200 text-xs font-semibold z-30 border border-white/10">
                        {activeImageIndex + 1} / {images.length}
                    </div>
                )}

                {/* Back button - CRITICAL: High z-index and clear contrast */}
                <Link
                    to="/archive"
                    className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-cream-400 transition-all bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 z-40 border border-white/10 hover:shadow-lg active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-semibold">Tribute Wall</span>
                </Link>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-30">
                    <div className="max-w-4xl mx-auto">
                        <p className="font-arabic text-cream-400/80 text-sm mb-1.5 drop-shadow-md">
                            إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                        </p>
                        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                            {fullName}
                        </h1>
                        {dateOfPassing && (
                            <p className="text-cream-100/90 text-lg font-medium drop-shadow-md">
                                Passed: {dateOfPassing}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Biography */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-cream-200">
                            <h2 className="font-heading text-xl font-semibold text-forest-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Biography
                            </h2>
                            {biography ? (
                                <p className="text-forest-700/80 leading-relaxed whitespace-pre-line">{biography}</p>
                            ) : (
                                <p className="text-forest-700/50 italic">No biography has been shared yet.</p>
                            )}
                        </div>

                        {/* Audio Tribute Player */}
                        {audioTributeUrl && (
                            <div className="bg-gradient-to-br from-forest-800 to-forest-900 rounded-2xl p-6 sm:p-8 border border-forest-700">
                                <h2 className="font-heading text-xl font-semibold text-cream-100 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🎙️</span>
                                    Voice Tribute
                                </h2>
                                <p className="text-cream-200/70 text-sm mb-4">
                                    A spoken tribute has been shared in memory of {fullName}.
                                </p>
                                <audio
                                    controls
                                    className="w-full rounded-lg"
                                    preload="metadata"
                                >
                                    <source src={audioTributeUrl} />
                                    Your browser does not support audio playback.
                                </audio>
                            </div>
                        )}

                        {/* Legacy Document */}
                        {memorial.legacyDocumentUrl && (
                            <div className="bg-forest-50 rounded-2xl p-6 sm:p-8 border border-forest-100">
                                <h2 className="font-heading text-xl font-semibold text-forest-900 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📜</span>
                                    Legacy Document
                                </h2>
                                <p className="text-forest-700 mb-4">
                                    A document has been archived for this memorial (e.g., Janazah announcement, biography).
                                </p>
                                <a
                                    href={memorial.legacyDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-colors shadow-md"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Document (PDF)
                                </a>
                            </div>
                        )}

                        {/* Thumbnail gallery strip (if multiple images) */}
                        {hasMultipleImages && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
                                <h2 className="font-heading text-sm font-semibold text-forest-900 mb-3">
                                    Gallery ({images.length} photos)
                                </h2>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setActiveImageIndex(idx);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === activeImageIndex
                                                ? 'border-forest-700 ring-2 ring-forest-600/30'
                                                : 'border-cream-200 hover:border-forest-400'
                                                }`}
                                        >
                                            <img
                                                src={optimizeImage(img)}
                                                alt={`${fullName} photo ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dua section */}
                        <div className="bg-forest-800 rounded-2xl p-6 text-center">
                            <p className="font-arabic text-cream-400 text-xl mb-3">
                                اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ
                            </p>
                            <p className="text-cream-200/70 text-sm italic">
                                &quot;O Allah, forgive them and have mercy on them.&quot;
                            </p>
                        </div>
                    </div>

                    {/* Sidebar actions */}
                    <div className="space-y-4">


                        {/* Message family */}
                        {currentUser && !isOwnPost && (
                            <button
                                onClick={handleMessageFamily}
                                disabled={startingChat}
                                className="w-full py-3 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                {startingChat ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        Opening chat...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Message Family
                                    </>
                                )}
                            </button>
                        )}

                        {!currentUser && (
                            <div className="text-center p-4 bg-forest-50 rounded-xl border border-forest-100">
                                <p className="text-forest-800 font-medium mb-2">Please Sign In to Send Condolences</p>
                                <Link
                                    to="/login"
                                    className="inline-block px-6 py-2 rounded-lg bg-forest-200 text-forest-800 font-semibold hover:bg-forest-300 transition-colors text-sm"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    );
}
