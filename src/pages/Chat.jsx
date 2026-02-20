import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    writeBatch,
    where,
    getDocs,
    deleteDoc,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';

const CLOUDINARY_CLOUD_NAME = 'dkinpssee';
const CLOUDINARY_AUDIO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const CLOUDINARY_IMAGE_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'wolo_uploads';

// Detect best supported audio MIME type (Safari/iOS uses mp4, Chrome/Firefox use webm)
function getSupportedMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    for (const type of types) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return '';
}

const QUICK_ACTIONS = [
    {
        label: '🕌 Ask about Janazah',
        messages: [
            'Assalamu Alaikum, I would like to ask about the Janazah arrangements.',
            'Assalamu Alaikum, has the Janazah date been confirmed?',
            'Assalamu Alaikum, where will the Janazah prayers be held?',
        ],
    },
    {
        label: '💚 Sadaqah Jariyah',
        messages: [
            'Assalamu Alaikum, I would like to inquire about Sadaqah Jariyah on behalf of the deceased.',
            'Assalamu Alaikum, how can I contribute to Sadaqah Jariyah for them?',
            'Assalamu Alaikum, is there a Sadaqah fund set up for the family?',
        ],
    },
    {
        label: '🤲 Condolences',
        messages: [
            'Inna lillahi wa inna ilayhi rajiun. May Allah grant them the highest level of Jannah.',
            'Inna lillahi wa inna ilayhi rajiun. May Allah grant the family patience during this time.',
            'My heartfelt condolences. May Allah shower His mercy upon the deceased.',
        ],
    },
    {
        label: '📅 Gathering',
        messages: [
            'Assalamu Alaikum, is there a memorial gathering planned? I would like to attend.',
            'Assalamu Alaikum, when and where is the gathering?',
            'Assalamu Alaikum, can I bring anything to the gathering?',
        ],
    },
];

const EMOJI_CATEGORIES = [
    { label: '😊', emojis: ['😊', '😢', '😭', '🥺', '❤️', '💔', '🤲', '🕊️', '🌹', '🌸', '💐', '🙏', '😇', '🥰', '💕', '💝', '🫶', '😔', '😞', '🤗'] },
    { label: '🕌', emojis: ['🕌', '☪️', '📿', '🤲', '🌙', '⭐', '🕋', '📖', '🪔', '🕯️', '🌺', '🌻', '🌷', '🍃', '🌿', '💫', '✨', '🌟', '💒', '🏡'] },
    { label: '👋', emojis: ['👋', '👍', '🤝', '✌️', '🫡', '💪', '🫂', '👏', '🙌', '🤞', '☝️', '👆', '👇', '👈', '👉', '🫰', '✊', '👊', '🤜', '🤛'] },
    { label: '🎉', emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🥳', '🥗', '🍲', '🍛', '☕', '🥛', '🍵', '🫖', '🍽️', '🥘', '🍚', '🧆', '🥙', '🫓', '🥧'] },
];

export default function Chat() {
    const { chatId } = useParams();
    const { currentUser, isDisabled } = useAuth();
    const bottomRef = useRef(null);

    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Voice note state
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Image state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef(null);

    // Emoji picker state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState(0);
    const emojiPickerRef = useRef(null);

    // Quick actions state
    const [openQuickAction, setOpenQuickAction] = useState(null);

    // Context menu (delete) state
    const [contextMenu, setContextMenu] = useState(null); // { msgId, x, y, isOwn }
    const longPressTimer = useRef(null);

    // Full-screen image viewer
    const [viewerImage, setViewerImage] = useState(null);



    // Fetch chat metadata
    useEffect(() => {
        async function fetchChat() {
            try {
                const snap = await getDoc(doc(db, 'chats', chatId));
                if (snap.exists()) {
                    setChat({ id: snap.id, ...snap.data() });
                }
            } catch (err) {
                console.error('Error fetching chat:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchChat();
    }, [chatId]);

    // Real-time messages listener
    useEffect(() => {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [chatId]);

    // Mark incoming messages as read when chat is open
    useEffect(() => {
        if (!currentUser || messages.length === 0) return;

        async function markAsRead() {
            try {
                const messagesRef = collection(db, 'chats', chatId, 'messages');
                const unreadQuery = query(
                    messagesRef,
                    where('senderId', '!=', currentUser.uid)
                );
                const snapshot = await getDocs(unreadQuery);

                const batch = writeBatch(db);
                let hasBatchOps = false;

                snapshot.docs.forEach((d) => {
                    const data = d.data();
                    const readBy = data.readBy || [];
                    if (!readBy.includes(currentUser.uid)) {
                        batch.update(d.ref, {
                            readBy: [...readBy, currentUser.uid],
                            status: 'read',
                        });
                        hasBatchOps = true;
                    }
                });

                if (hasBatchOps) {
                    await batch.commit();
                }
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        }

        markAsRead();
    }, [messages, currentUser, chatId]);

    // Close context menu on outside click
    useEffect(() => {
        function handleClick() {
            setContextMenu(null);
        }
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Protected Route: Redirect to login if not authenticated
    if (!currentUser) return <Navigate to="/login" replace />;

    if (isDisabled) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">Account Restricted</h2>
                    <p className="text-forest-700/70 text-sm">Your account has been temporarily restricted. You cannot access chat at this time.</p>
                    <p className="text-forest-600/50 text-xs mt-3">Please contact the admin for more information.</p>
                </div>
            </div>
        );
    }

    // ─── Voice Recording ─────────────────────────────────
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : undefined;
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blobType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(audioChunksRef.current, { type: blobType });
                setAudioBlob(blob);
                setAudioPreviewUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access denied:', err);
            alert('Please allow microphone access to record a voice note.');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    }

    function discardRecording() {
        setAudioBlob(null);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
    }

    async function uploadAudioToCloudinary(blob) {
        const formData = new FormData();
        formData.append('file', blob, blob.type === 'audio/mp4' ? 'voice_note.m4a' : 'voice_note.webm');
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'wolo_audio');
        formData.append('resource_type', 'auto');

        const response = await fetch(CLOUDINARY_AUDIO_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Audio upload failed');
        const data = await response.json();
        return data.secure_url;
    }

    // ─── Image Handling ─────────────────────────────────
    function handleImageSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        e.target.value = '';
    }

    function discardImage() {
        setImageFile(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
    }

    async function uploadImageToCloudinary(file) {
        // Compress before uploading
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        };
        const compressed = await imageCompression(file, options);

        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'wolo_chat_images');

        const response = await fetch(CLOUDINARY_IMAGE_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Image upload failed');
        const data = await response.json();
        return data.secure_url;
    }

    // ─── Send Messages ─────────────────────────────────
    async function sendMessage(text, audioUrl = null, imageUrl = null) {
        if ((!text.trim() && !audioUrl && !imageUrl) || sending) return;

        setSending(true);
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const messageData = {
                text: text.trim(),
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                createdAt: serverTimestamp(),
                status: 'sent',
                readBy: [],
                deletedFor: [],
                deletedForEveryone: false,
            };

            if (audioUrl) messageData.audioUrl = audioUrl;
            if (imageUrl) messageData.imageUrl = imageUrl;

            await addDoc(messagesRef, messageData);

            // Update chat's last message
            let lastMsg = text.trim();
            if (imageUrl && !lastMsg) lastMsg = '📷 Photo';
            if (audioUrl && !lastMsg) lastMsg = '🎙️ Voice Note';

            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: lastMsg,
                lastMessageAt: serverTimestamp(),
            });

            // Notify the other participant
            const senderLabel = currentUser.displayName || currentUser.email || 'Someone';
            const recipientUid = chat?.participants?.find((p) => p !== currentUser.uid);
            if (recipientUid) {
                await addDoc(collection(db, 'notifications'), {
                    userId: recipientUid,
                    type: 'message',
                    memorialName: chat.memorialName || 'Chat',
                    message: `${senderLabel} has sent you a message — click to view`,
                    chatId: chatId,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }

            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message: ' + err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleSendVoiceNote() {
        if (!audioBlob) return;
        setUploadingAudio(true);
        try {
            const audioUrl = await uploadAudioToCloudinary(audioBlob);
            await sendMessage(newMessage, audioUrl);
            discardRecording();
        } catch (err) {
            console.error('Error sending voice note:', err);
            alert('Failed to send voice note. Please try again.');
        } finally {
            setUploadingAudio(false);
        }
    }

    async function handleSendImage() {
        if (!imageFile) return;
        setUploadingImage(true);
        try {
            const imageUrl = await uploadImageToCloudinary(imageFile);
            await sendMessage(newMessage, null, imageUrl);
            discardImage();
        } catch (err) {
            console.error('Error sending image:', err);
            alert('Failed to send image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (imageFile) {
            handleSendImage();
        } else if (audioBlob) {
            handleSendVoiceNote();
        } else if (newMessage.trim()) {
            sendMessage(newMessage);
        }
    }

    function handleQuickAction(index) {
        setOpenQuickAction(openQuickAction === index ? null : index);
    }

    function handleQuickSubMessage(message) {
        sendMessage(message);
        setOpenQuickAction(null);
    }

    // ─── Message Deletion ─────────────────────────────────
    async function handleDeleteForMe(msgId) {
        try {
            const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
            await updateDoc(msgRef, {
                deletedFor: arrayUnion(currentUser.uid),
            });
        } catch (err) {
            console.error('Error deleting for me:', err);
            alert('Failed to delete message.');
        }
        setContextMenu(null);
    }

    async function handleDeleteForEveryone(msgId) {
        try {
            const msgRef = doc(db, 'chats', chatId, 'messages', msgId);
            await updateDoc(msgRef, {
                deletedForEveryone: true,
                text: '',
                imageUrl: null,
                audioUrl: null,
            });
        } catch (err) {
            console.error('Error deleting for everyone:', err);
            alert('Failed to delete message.');
        }
        setContextMenu(null);
    }

    // Long-press / right-click to open context menu
    function handleMsgTouchStart(e, msgId, isOwn) {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches?.[0];
            const x = touch ? touch.clientX : e.clientX;
            const y = touch ? touch.clientY : e.clientY;
            setContextMenu({ msgId, x, y, isOwn });
        }, 500);
    }

    function handleMsgTouchEnd() {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }

    function handleMsgContextMenu(e, msgId, isOwn) {
        e.preventDefault();
        setContextMenu({ msgId, x: e.clientX, y: e.clientY, isOwn });
    }

    // ─── Tick indicator component ─────────────────────
    function MessageTicks({ msg }) {
        if (msg.senderId !== currentUser.uid) return null;

        const isRead = msg.status === 'read' || (msg.readBy && msg.readBy.length > 0);

        if (isRead) {
            return (
                <span className="inline-flex items-center ml-1" title="Read">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 16" fill="none">
                        <path d="M1 8l4 4L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 8l4 4L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            );
        }

        return (
            <span className="inline-flex items-center ml-1" title="Sent">
                <svg className="w-3.5 h-3.5 text-cream-300/60" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l4 4L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        );
    }

    // ─── Filter messages ─────────────────────────────────
    const visibleMessages = messages.filter((msg) => {
        // Hide messages deleted for current user
        if (msg.deletedFor && msg.deletedFor.includes(currentUser.uid)) return false;
        return true;
    });

    // ─── Render ─────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-forest-300 border-t-forest-700 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-heading text-2xl font-bold text-forest-900 mb-2">Chat Not Found</h2>
                    <Link to="/archive" className="text-forest-700 hover:text-cream-400 transition-colors font-semibold">
                        Back to Tribute Wall
                    </Link>
                </div>
            </div>
        );
    }

    const otherUid = chat.participants?.find((p) => p !== currentUser.uid);
    const otherName = chat.participantNames?.[otherUid] || 'Community Member';
    const isBusy = sending || uploadingAudio || uploadingImage;

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col">
            {/* Chat header */}
            <div className="bg-forest-900 shadow-lg sticky top-16 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
                    <Link
                        to={chat.memorialId ? `/memorial/${chat.memorialId}` : '/archive'}
                        className="text-cream-200 hover:text-cream-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-cream-100 font-semibold truncate">{otherName}</h2>
                        {chat.memorialName && (
                            <p className="text-cream-300/60 text-xs truncate">
                                Re: {chat.memorialName}
                            </p>
                        )}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-cream-200 font-heading font-bold text-sm">
                        {otherName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
                    {visibleMessages.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-200 flex items-center justify-center">
                                <svg className="w-8 h-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-forest-700/70 text-sm mb-1">No messages yet</p>
                            <p className="text-forest-700/50 text-xs">Send a message or use a quick action below to start the conversation.</p>
                        </div>
                    )}

                    {visibleMessages.map((msg) => {
                        const isOwn = msg.senderId === currentUser.uid;
                        const isDeletedForEveryone = msg.deletedForEveryone === true;

                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 select-none ${isOwn
                                        ? 'bg-forest-800 text-cream-100 rounded-br-md'
                                        : 'bg-white text-forest-900 border border-cream-200 rounded-bl-md'
                                        } ${isDeletedForEveryone ? 'opacity-70' : ''}`}
                                    onTouchStart={(e) => !isDeletedForEveryone && handleMsgTouchStart(e, msg.id, isOwn)}
                                    onTouchEnd={handleMsgTouchEnd}
                                    onTouchCancel={handleMsgTouchEnd}
                                    onContextMenu={(e) => !isDeletedForEveryone && handleMsgContextMenu(e, msg.id, isOwn)}
                                >
                                    {!isOwn && (
                                        <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-cream-400' : 'text-forest-600'}`}>
                                            {msg.senderName}
                                        </p>
                                    )}

                                    {isDeletedForEveryone ? (
                                        <p className="text-sm italic opacity-70">🚫 This message was deleted</p>
                                    ) : (
                                        <>
                                            {/* Image */}
                                            {msg.imageUrl && (
                                                <div className="mb-2">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Shared image"
                                                        className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => setViewerImage(msg.imageUrl)}
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {msg.text && (
                                                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                                            )}

                                            {/* Audio playback */}
                                            {msg.audioUrl && (
                                                <div className={`mt-2 flex items-center gap-2 ${isOwn ? 'text-cream-200' : 'text-forest-700'}`}>
                                                    <span className="text-sm">🎙️</span>
                                                    <audio controls preload="metadata" className="h-8 max-w-[200px]">
                                                        <source src={msg.audioUrl} />
                                                    </audio>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Time + Ticks */}
                                    <div className={`flex items-center justify-end gap-0.5 mt-1.5 ${isOwn ? 'text-cream-300/50' : 'text-forest-600/40'}`}>
                                        <span className="text-[10px]">
                                            {msg.createdAt?.toDate?.()
                                                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '...'}
                                        </span>
                                        {!isDeletedForEveryone && <MessageTicks msg={msg} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Context menu for delete */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-cream-300 py-1 min-w-[180px] animate-in fade-in"
                    style={{
                        top: Math.min(contextMenu.y, window.innerHeight - 120),
                        left: Math.min(contextMenu.x, window.innerWidth - 200),
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => handleDeleteForMe(contextMenu.msgId)}
                        className="w-full text-left px-4 py-2.5 text-sm text-forest-800 hover:bg-cream-100 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete for me
                    </button>
                    {contextMenu.isOwn && (
                        <button
                            onClick={() => handleDeleteForEveryone(contextMenu.msgId)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Delete for everyone
                        </button>
                    )}
                    <button
                        onClick={() => setContextMenu(null)}
                        className="w-full text-left px-4 py-2.5 text-sm text-forest-500 hover:bg-cream-100 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                    </button>
                </div>
            )}

            {/* Full-screen image viewer */}
            {viewerImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setViewerImage(null)}
                >
                    <button
                        onClick={() => setViewerImage(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors text-xl"
                    >
                        ✕
                    </button>
                    <img src={viewerImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
            )}

            {/* Quick actions — always visible */}
            <div className="border-t border-cream-200 bg-cream-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
                    <p className="text-xs text-forest-700/50 mb-1.5 font-medium">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((action, index) => (
                            <div key={action.label} className="relative">
                                <button
                                    onClick={() => handleQuickAction(index)}
                                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${openQuickAction === index
                                        ? 'bg-forest-800 text-cream-100 border-forest-800'
                                        : 'bg-white border-cream-300 text-forest-800 hover:bg-cream-200 hover:border-cream-400'
                                        }`}
                                >
                                    {action.label}
                                </button>

                                {/* Sub-message dropdown */}
                                {openQuickAction === index && (
                                    <div className="absolute bottom-full left-0 mb-1 w-72 bg-white rounded-xl shadow-xl border border-cream-300 py-1 z-50 max-h-48 overflow-y-auto">
                                        {action.messages.map((msg, msgIdx) => (
                                            <button
                                                key={msgIdx}
                                                onClick={() => handleQuickSubMessage(msg)}
                                                className="w-full text-left px-3 py-2 text-xs text-forest-800 hover:bg-cream-100 transition-colors border-b border-cream-100 last:border-b-0 leading-relaxed"
                                            >
                                                {msg}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Image preview bar */}
            {imagePreviewUrl && (
                <div className="border-t border-cream-200 bg-cream-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-forest-700">📷 Photo</span>
                            <img src={imagePreviewUrl} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-cream-300" />
                            <button
                                onClick={discardImage}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio recording preview */}
            {audioPreviewUrl && (
                <div className="border-t border-cream-200 bg-cream-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-forest-700">🎙️ Voice Note</span>
                            <audio controls src={audioPreviewUrl} preload="metadata" className="h-8 flex-1 max-w-xs" />
                            <button
                                onClick={discardRecording}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message input */}
            <div className="border-t border-cream-200 bg-white">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-end gap-2">
                        {/* Record / Stop button */}
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isBusy}
                            className={`h-[46px] w-[46px] flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 ${isRecording
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-cream-200 text-forest-700 hover:bg-cream-300'
                                }`}
                            title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                        >
                            {isRecording ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>

                        {/* Image attach button */}
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isBusy || !!audioBlob}
                            className="h-[46px] w-[46px] flex-shrink-0 rounded-xl flex items-center justify-center bg-cream-200 text-forest-700 hover:bg-cream-300 transition-all disabled:opacity-40"
                            title="Send a photo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />

                        <div className="flex-1 relative">
                            <textarea
                                rows={1}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                onFocus={() => { setShowEmojiPicker(false); setOpenQuickAction(null); }}
                                placeholder={imageFile ? 'Add a caption (optional)...' : audioBlob ? 'Add a caption (optional)...' : 'Type a message...'}
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 resize-none text-sm"
                            />
                            {/* Emoji toggle button */}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-200 transition-colors text-lg"
                                title="Emoji"
                            >
                                😊
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !audioBlob && !imageFile) || isBusy}
                            className="h-[46px] px-5 rounded-xl bg-forest-800 text-cream-100 font-semibold hover:bg-forest-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                        >
                            {isBusy ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Emoji picker panel */}
                    {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="mt-2 rounded-xl border border-cream-300 bg-white shadow-lg overflow-hidden">
                            {/* Category tabs */}
                            <div className="flex border-b border-cream-200">
                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setEmojiCategory(idx)}
                                        className={`flex-1 py-2 text-lg transition-colors ${emojiCategory === idx ? 'bg-cream-200' : 'hover:bg-cream-100'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            {/* Emoji grid */}
                            <div className="p-2 grid grid-cols-10 gap-0.5 max-h-[160px] overflow-y-auto">
                                {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setNewMessage((prev) => prev + emoji);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-200 transition-colors text-lg cursor-pointer"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
