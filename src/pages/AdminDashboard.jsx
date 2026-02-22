import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { currentUser, isAdmin, loading: authLoading } = useAuth();

    const [users, setUsers] = useState([]);
    const [memorials, setMemorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('approvals');
    const [customMessages, setCustomMessages] = useState({}); // { [memorialId]: message }

    useEffect(() => {
        if (!isAdmin || authLoading) return;

        setLoading(true);

        // Real-time listener for users
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
            setUsers(usersData);
        }, (err) => console.error('Users listener error:', err));

        // Real-time listener for ALL memorials (admin sees everything)
        const unsubMemorials = onSnapshot(collection(db, 'memorials'), (snap) => {
            const memorialsData = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setMemorials(memorialsData);
            setLoading(false);
        }, (err) => {
            console.error('Memorials listener error:', err);
            setLoading(false);
        });

        return () => {
            unsubUsers();
            unsubMemorials();
        };
    }, [isAdmin, authLoading]);

    // Auth Guard
    if (authLoading) return <div className="p-10 text-center">Loading...</div>;
    if (!currentUser || !isAdmin) return <Navigate to="/" replace />;

    // Handlers
    async function toggleUserVerification(userId, currentStatus) {
        try {
            await updateDoc(doc(db, 'users', userId), { isVerified: !currentStatus });
            // State update handled by onSnapshot
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update verification: " + err.message);
        }
    }

    async function toggleUserAccess(userId, isDisabled) {
        try {
            await updateDoc(doc(db, 'users', userId), { isDisabled: !isDisabled });
            // State update handled by onSnapshot
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update status: " + err.message);
        }
    }

    // Helper: find the poster's email from the users list
    function getPosterEmail(memorial) {
        const user = users.find(u => u.id === memorial.postedBy || u.uid === memorial.postedBy);
        return user?.email || null;
    }

    async function approveMemorial(memorialId) {
        try {
            const memorial = memorials.find(m => m.id === memorialId);
            await updateDoc(doc(db, 'memorials', memorialId), {
                isApproved: true,
                status: 'approved',
            });
            setMemorials(prev => prev.filter(m => m.id !== memorialId));

            // Create in-app notification for the poster
            if (memorial?.postedBy) {
                const adminMsg = customMessages[memorialId]?.trim();
                await addDoc(collection(db, 'notifications'), {
                    userId: memorial.postedBy,
                    memorialId: memorialId,
                    memorialName: memorial.fullName || 'Memorial',
                    type: 'approved',
                    message: adminMsg || 'Your tribute to the Kamgbunli Digital Sanctuary has been approved and is now live on the Tribute Wall!',
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
                setCustomMessages(prev => { const next = { ...prev }; delete next[memorialId]; return next; });
            }
        } catch (err) {
            console.error("Error approving memorial:", err);
            alert('Failed to approve: ' + err.message);
        }
    }

    async function rejectMemorial(memorialId) {
        if (!window.confirm("Reject this memorial? It will be hidden from the Tribute Wall but NOT deleted.")) return;
        try {
            const memorial = memorials.find(m => m.id === memorialId);
            await updateDoc(doc(db, 'memorials', memorialId), {
                isApproved: false,
                status: 'rejected',
            });

            // Create in-app notification for the poster
            if (memorial?.postedBy) {
                const adminMsg = customMessages[memorialId]?.trim();
                await addDoc(collection(db, 'notifications'), {
                    userId: memorial.postedBy,
                    memorialId: memorialId,
                    memorialName: memorial.fullName || 'Memorial',
                    type: 'denied',
                    message: adminMsg || 'Your tribute was not approved at this time. Please contact the Admin for more details.',
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
                setCustomMessages(prev => { const next = { ...prev }; delete next[memorialId]; return next; });
            }
        } catch (err) {
            console.error("Error rejecting memorial:", err);
        }
    }

    async function permanentlyDeleteMemorial(memorialId) {
        if (!window.confirm("⚠️ PERMANENTLY DELETE this memorial? This cannot be undone!")) return;
        try {
            await deleteDoc(doc(db, 'memorials', memorialId));
        } catch (err) {
            console.error("Error deleting memorial:", err);
        }
    }

    async function clearAllMemorials() {
        if (!window.confirm('⚠️ DELETE ALL MEMORIALS? This will permanently remove every memorial from the database.')) return;
        if (!window.confirm('Are you absolutely sure? This action CANNOT be undone.')) return;
        try {
            const snapshot = await getDocs(collection(db, 'memorials'));
            // Firestore batches support max 500 ops
            const batchSize = 500;
            const docs = snapshot.docs;
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = writeBatch(db);
                docs.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        } catch (err) {
            console.error('Error clearing memorials:', err);
            alert('Failed to clear: ' + err.message);
        }
    }

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Header */}
            <div className="bg-forest-900 text-cream-100 py-8 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-forest-400 text-sm">Manage users and content</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-forest-800 px-4 py-2 rounded-lg text-sm">
                            <span className="font-bold text-cream-400">{memorials.length}</span> Total Posts
                        </div>
                        <div className="bg-forest-800 px-4 py-2 rounded-lg text-sm">
                            <span className="font-bold text-cream-400">{users.length}</span> Total Users
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-cream-200 pb-1">
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'approvals'
                            ? 'bg-white text-forest-900 border-b-2 border-forest-600'
                            : 'text-forest-600 hover:bg-white/50'
                            }`}
                    >
                        All Memorials ({memorials.length})
                    </button>
                    <button
                        onClick={clearAllMemorials}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors text-red-500 hover:bg-red-50 ml-auto`}
                    >
                        🗑️ Clear All
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === 'users'
                            ? 'bg-white text-forest-900 border-b-2 border-forest-600'
                            : 'text-forest-600 hover:bg-white/50'
                            }`}
                    >
                        User Management
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-forest-600">Loading data...</div>
                ) : (
                    <>
                        {activeTab === 'approvals' && (
                            <div className="space-y-6">
                                {memorials.length === 0 ? (
                                    <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-cream-200">
                                        <p className="text-forest-600">No memorials found in the database.</p>
                                    </div>
                                ) : (
                                    memorials.map(m => {
                                        const statusColor = m.isApproved ? 'green' : m.status === 'rejected' ? 'red' : 'yellow';
                                        const statusLabel = m.isApproved ? 'Approved' : m.status === 'rejected' ? 'Rejected' : 'Pending';
                                        const borderColor = statusColor === 'green' ? 'border-green-200' : statusColor === 'red' ? 'border-red-200' : 'border-yellow-200';
                                        const bgColor = statusColor === 'green' ? 'bg-green-50' : statusColor === 'red' ? 'bg-red-50' : 'bg-yellow-50';
                                        return (
                                            <div key={m.id} className={`${bgColor} border ${borderColor} rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6`}>
                                                {/* Image Preview */}
                                                <div className="w-24 h-24 bg-forest-200 rounded-lg flex-shrink-0 overflow-hidden">
                                                    {m.imageUrl ? (
                                                        <img src={m.imageUrl} alt={m.fullName} loading="lazy" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-forest-400 font-bold text-xl">
                                                            {m.fullName?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-heading text-xl font-bold text-forest-900">{m.fullName}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor === 'green' ? 'bg-green-100 text-green-700' :
                                                            statusColor === 'red' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>{statusLabel}</span>
                                                    </div>
                                                    <p className="text-sm text-forest-700 mb-2">
                                                        Passed: {m.dateOfPassing || '?'}
                                                    </p>
                                                    <div className="p-3 bg-white rounded-lg border border-cream-200 text-sm text-forest-800 mb-3 max-h-32 overflow-y-auto">
                                                        {m.biography || "No biography provided."}
                                                    </div>
                                                    <p className="text-xs text-forest-500">
                                                        Submitted by: {m.postedByName || m.postedBy}
                                                        {m.postedByEmail && <span className="text-forest-400"> ({m.postedByEmail})</span>}
                                                        {' '}on {new Date(m.createdAt?.seconds * 1000).toLocaleDateString('en-GB')}
                                                    </p>
                                                </div>

                                                {/* Admin Message + Actions */}
                                                <div className={`flex flex-col gap-3 border-t md:border-t-0 md:border-l ${borderColor} pt-4 md:pt-0 md:pl-6 min-w-[200px]`}>
                                                    {/* Custom message textarea */}
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Custom message to user (optional)..."
                                                        value={customMessages[m.id] || ''}
                                                        onChange={(e) => setCustomMessages(prev => ({ ...prev, [m.id]: e.target.value }))}
                                                        className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 text-xs resize-none"
                                                    />
                                                    <div className="flex md:flex-col gap-2">
                                                        {!m.isApproved && (
                                                            <button
                                                                onClick={() => approveMemorial(m.id)}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {m.isApproved && (
                                                            <button
                                                                onClick={() => rejectMemorial(m.id)}
                                                                className="px-4 py-2 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-semibold hover:bg-yellow-200 transition-colors"
                                                            >
                                                                Unapprove
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => permanentlyDeleteMemorial(m.id)}
                                                            className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-white rounded-xl shadow-sm border border-cream-200 overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden md:block">
                                    <table className="w-full text-left">
                                        <thead className="bg-forest-50 border-b border-cream-200">
                                            <tr>
                                                <th className="px-6 py-4 text-sm font-bold text-forest-900">Name</th>
                                                <th className="px-6 py-4 text-sm font-bold text-forest-900">Email</th>
                                                <th className="px-6 py-4 text-sm font-bold text-forest-900">Role</th>
                                                <th className="px-6 py-4 text-sm font-bold text-forest-900">Status</th>
                                                <th className="px-6 py-4 text-sm font-bold text-forest-900 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cream-100">
                                            {users.map(user => (
                                                <tr key={user.id} className="hover:bg-cream-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-forest-900">{user.displayName || 'No Name'}</div>
                                                        <div className="text-xs text-forest-500">{user.location || 'No Location'}</div>
                                                        <div className="text-[10px] text-forest-400 mt-1">
                                                            Joined: {user.createdAt
                                                                ? (user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                                : 'Unknown'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-forest-700">{user.email}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {user.role || 'Member'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            {user.isVerified && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>}
                                                            {user.isDisabled && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Disabled</span>}
                                                            {!user.isVerified && !user.isDisabled && <span className="text-xs text-gray-400">Active</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => toggleUserVerification(user.id, user.isVerified)}
                                                            className={`text-xs px-3 py-1.5 rounded border transition-colors ${user.isVerified
                                                                ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                                                : 'border-green-300 text-green-700 hover:bg-green-50'
                                                                }`}
                                                        >
                                                            {user.isVerified ? 'Unverify' : 'Verify'}
                                                        </button>
                                                        <button
                                                            onClick={() => toggleUserAccess(user.id, user.isDisabled)}
                                                            className={`text-xs px-3 py-1.5 rounded border transition-colors ${user.isDisabled
                                                                ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                                                : 'border-red-300 text-red-700 hover:bg-red-50'
                                                                }`}
                                                        >
                                                            {user.isDisabled ? 'Enable' : 'Disable'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-cream-100">
                                    {users.map(user => (
                                        <div key={user.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-forest-900">{user.displayName || 'No Name'}</div>
                                                    <div className="text-xs text-forest-500">{user.email}</div>
                                                    <div className="text-[10px] text-forest-400 mt-0.5">
                                                        Joined: {user.createdAt
                                                            ? (user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                            : 'Unknown'}
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {user.role || 'Member'}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 flex-wrap">
                                                {user.isVerified && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>}
                                                {user.isDisabled && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Disabled</span>}
                                                {!user.isVerified && !user.isDisabled && <span className="text-xs text-gray-400">Active</span>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <button
                                                    onClick={() => toggleUserVerification(user.id, user.isVerified)}
                                                    className={`text-xs px-3 py-2 rounded border text-center transition-colors ${user.isVerified
                                                        ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                                        : 'border-green-300 text-green-700 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {user.isVerified ? 'Unverify' : 'Verify'}
                                                </button>
                                                <button
                                                    onClick={() => toggleUserAccess(user.id, user.isDisabled)}
                                                    className={`text-xs px-3 py-2 rounded border text-center transition-colors ${user.isDisabled
                                                        ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                                        : 'border-red-300 text-red-700 hover:bg-red-50'
                                                        }`}
                                                >
                                                    {user.isDisabled ? 'Enable' : 'Disable'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        )}
                    </>
                )}
            </div>
        </div>
    );
}
