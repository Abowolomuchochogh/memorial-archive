import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'myposts'

    // Real-time notifications listener
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (err) => {
            console.error('Notifications listener error:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Real-time listener for user's own posts
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'memorials'),
            where('postedBy', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setPostsLoading(false);
        }, (err) => {
            console.error('My posts listener error:', err);
            setPostsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (!currentUser) return <Navigate to="/login" replace />;

    async function markAsRead(notifId) {
        try {
            await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    }

    async function markAllAsRead() {
        try {
            const unread = notifications.filter(n => !n.isRead);
            await Promise.all(unread.map(n =>
                updateDoc(doc(db, 'notifications', n.id), { isRead: true })
            ));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    }

    async function deleteNotification(e, notifId) {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'notifications', notifId));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    }

    async function clearAllNotifications() {
        if (!window.confirm('Clear all notifications? This cannot be undone.')) return;
        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', currentUser.uid)
            );
            const snapshot = await getDocs(q);
            await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    }

    async function deleteMyPost(e, postId) {
        e.stopPropagation();
        if (!window.confirm('Delete this memorial? This cannot be undone.')) return;
        try {
            await deleteDoc(doc(db, 'memorials', postId));
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete: ' + err.message);
        }
    }

    function handleNotificationClick(notif) {
        if (!notif.isRead) markAsRead(notif.id);

        // Navigate to the chat if it's a message notification with a chatId
        if (notif.type === 'message' && notif.chatId) {
            navigate('/chat/' + notif.chatId);
            return;
        }

        // Navigate to the memorial if it's an approval/denial and has memorialId
        if ((notif.type === 'approved' || notif.type === 'denied') && notif.memorialId) {
            navigate('/memorial/' + notif.memorialId);
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // ─── Render notification card ───────────────────
    function renderNotification(notif) {
        const isMessage = notif.type === 'message';
        const isApproved = notif.type === 'approved';

        let bgClass = 'bg-white border-cream-200';
        if (!notif.isRead) {
            if (isMessage) bgClass = 'bg-blue-50 border-blue-200 shadow-sm';
            else if (isApproved) bgClass = 'bg-green-50 border-green-200 shadow-sm';
            else bgClass = 'bg-red-50 border-red-200 shadow-sm';
        }

        let icon, iconBg;
        if (isMessage) { icon = '💬'; iconBg = 'bg-blue-100 text-blue-600'; }
        else if (isApproved) { icon = '✅'; iconBg = 'bg-green-100 text-green-600'; }
        else { icon = '❌'; iconBg = 'bg-red-100 text-red-600'; }

        let badgeLabel, badgeBg;
        if (isMessage) { badgeLabel = 'New Message'; badgeBg = 'bg-blue-100 text-blue-700'; }
        else if (isApproved) { badgeLabel = 'Approved'; badgeBg = 'bg-green-100 text-green-700'; }
        else { badgeLabel = 'Denied'; badgeBg = 'bg-red-100 text-red-700'; }

        return (
            <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${bgClass}`}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${iconBg}`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeBg}`}>
                                {badgeLabel}
                            </span>
                            {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse"></span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-forest-900 mb-1">
                            {notif.memorialName || 'Notification'}
                        </p>
                        {notif.message && (
                            <p className="text-sm text-forest-700/80 whitespace-pre-line mb-2">
                                {notif.message}
                            </p>
                        )}
                        {isMessage && notif.chatId && (
                            <p className="text-xs font-semibold text-blue-600 mt-1">
                                Tap to open chat →
                            </p>
                        )}
                        {!isMessage && notif.memorialId && (
                            <p className="text-xs font-semibold text-forest-600 mt-1">
                                Tap to view memorial →
                            </p>
                        )}
                        <p className="text-[10px] text-forest-500/50 mt-1">
                            {notif.createdAt?.toDate?.()
                                ? notif.createdAt.toDate().toLocaleString()
                                : '...'}
                        </p>
                    </div>
                    <button
                        onClick={(e) => deleteNotification(e, notif.id)}
                        className="self-start p-1.5 rounded-lg text-forest-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Delete notification"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // ─── Render my post card ───────────────────
    function renderMyPost(post) {
        const status = post.status || (post.isApproved ? 'approved' : 'pending');

        let statusBg, statusText, statusIcon;
        if (status === 'approved') {
            statusBg = 'bg-green-100 text-green-700';
            statusText = 'Approved';
            statusIcon = '✅';
        } else if (status === 'rejected' || status === 'denied') {
            statusBg = 'bg-red-100 text-red-700';
            statusText = 'Denied';
            statusIcon = '❌';
        } else {
            statusBg = 'bg-yellow-100 text-yellow-700';
            statusText = 'Pending Review';
            statusIcon = '⏳';
        }

        return (
            <div
                key={post.id}
                onClick={() => status === 'approved' && navigate('/memorial/' + post.id)}
                className={`rounded-xl border p-4 transition-all ${status === 'approved' ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''} bg-white border-cream-200`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-cream-200">
                        {statusIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBg}`}>
                                {statusText}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-forest-900 mb-1">
                            {post.fullName || 'Memorial'}
                        </p>
                        {post.dateOfPassing && (
                            <p className="text-xs text-forest-600/60 mb-1">
                                Passed: {post.dateOfPassing}
                            </p>
                        )}
                        {post.biography && (
                            <p className="text-xs text-forest-700/60 line-clamp-2 mb-2">
                                {post.biography.length > 120 ? post.biography.slice(0, 120) + '…' : post.biography}
                            </p>
                        )}
                        {status === 'approved' && (
                            <p className="text-xs font-semibold text-forest-600 mt-1">
                                Tap to view memorial →
                            </p>
                        )}
                        <p className="text-[10px] text-forest-500/50 mt-1">
                            Submitted: {post.createdAt?.toDate?.()
                                ? post.createdAt.toDate().toLocaleString()
                                : '...'}
                        </p>
                    </div>
                    <button
                        onClick={(e) => deleteMyPost(e, post.id)}
                        className="self-start p-1.5 rounded-lg text-forest-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Delete this memorial"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h1 className="font-heading text-2xl font-bold text-forest-900">Activity</h1>
                    {activeTab === 'notifications' && notifications.length > 0 && (
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-cream-300 text-forest-700 hover:bg-cream-200 transition-colors font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={clearAllNotifications}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-cream-200 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'notifications'
                            ? 'bg-white text-forest-900 shadow-sm'
                            : 'text-forest-600 hover:text-forest-800'
                            }`}
                    >
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('myposts')}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'myposts'
                            ? 'bg-white text-forest-900 shadow-sm'
                            : 'text-forest-600 hover:text-forest-800'
                            }`}
                    >
                        My Posts
                        {myPosts.length > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-forest-600 text-white text-[10px] font-bold">
                                {myPosts.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ─── Notifications Tab ─── */}
                {activeTab === 'notifications' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-forest-300 border-t-forest-700 rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-forest-200 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-forest-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-forest-700/70 text-sm">No notifications yet</p>
                                <p className="text-forest-600/40 text-xs mt-1">You'll be notified about messages and tribute reviews</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map(renderNotification)}
                            </div>
                        )}
                    </>
                )}

                {/* ─── My Posts Tab ─── */}
                {activeTab === 'myposts' && (
                    <>
                        {postsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-10 h-10 border-4 border-forest-300 border-t-forest-700 rounded-full animate-spin"></div>
                            </div>
                        ) : myPosts.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-forest-200 flex items-center justify-center">
                                    <span className="text-2xl">🕊️</span>
                                </div>
                                <p className="text-forest-700/70 text-sm">No tributes submitted yet</p>
                                <p className="text-forest-600/40 text-xs mt-1">
                                    Your submitted tributes will appear here
                                </p>
                                <button
                                    onClick={() => navigate('/upload')}
                                    className="mt-4 px-4 py-2 rounded-lg bg-forest-800 text-cream-100 text-sm font-semibold hover:bg-forest-700 transition-colors"
                                >
                                    Submit a Tribute
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myPosts.map(renderMyPost)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
