import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';

const CLOUDINARY_CLOUD_NAME = 'dkinpssee';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'wolo_uploads';
const MAX_PHOTOS = 3;

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

export default function EditMemorial() {
    const { id } = useParams();
    const { currentUser, isDisabled } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        fullName: '',
        familyHouse: '',
        dateOfPassing: '',
        biography: '',
        relationship: '',
    });

    // We'll store existing URLs and newly selected File objects
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [newPhotoFiles, setNewPhotoFiles] = useState([]);
    const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    useEffect(() => {
        async function fetchMemorial() {
            try {
                const snap = await getDoc(doc(db, 'memorials', id));
                if (snap.exists()) {
                    const data = snap.data();
                    // Security check: Only author or admin should be here
                    if (data.postedBy !== currentUser.uid && !currentUser.isAdmin) {
                        navigate('/archive');
                        return;
                    }

                    setForm({
                        fullName: data.fullName || '',
                        familyHouse: data.familyHouse || '',
                        dateOfPassing: data.dateOfPassing || '',
                        biography: data.biography || '',
                        relationship: data.relationship || '',
                    });
                    setExistingPhotos(getImageList(data));
                } else {
                    navigate('/archive');
                }
            } catch (err) {
                console.error('Error fetching memorial:', err);
                setError('Failed to load memorial details.');
            } finally {
                setLoading(false);
            }
        }
        if (currentUser) {
            fetchMemorial();
        }
    }, [id, currentUser, navigate]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handlePhotoSelect(e) {
        const selectedFiles = Array.from(e.target.files || []);
        const totalCount = existingPhotos.length + newPhotoFiles.length;
        const totalAllowed = Math.max(0, MAX_PHOTOS - totalCount);
        const addedFiles = selectedFiles.slice(0, totalAllowed);

        if (addedFiles.length === 0) return;

        const updatedFiles = [...newPhotoFiles, ...addedFiles];
        const addedPreviews = addedFiles.map(f => URL.createObjectURL(f));
        const updatedPreviews = [...newPhotoPreviews, ...addedPreviews];

        setNewPhotoFiles(updatedFiles);
        setNewPhotoPreviews(updatedPreviews);
        e.target.value = '';
    }

    function removeExistingPhoto(index) {
        setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    }

    function removeNewPhoto(index) {
        URL.revokeObjectURL(newPhotoPreviews[index]);
        setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    }

    useEffect(() => {
        return () => newPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [newPhotoPreviews]);

    if (!currentUser) return <Navigate to="/login" replace />;

    if (isDisabled) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">Account Restricted</h2>
                    <p className="text-forest-700/70 text-sm">Your account has been temporarily restricted. You cannot edit memorials at this time.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-forest-300 border-t-forest-700 rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    async function uploadToCloudinary(file) {
        // Compress before uploading
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressed = await imageCompression(file, options);

        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'wolo_memorials');

        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Upload failed (${response.status})`);
        }

        const data = await response.json();
        return data.secure_url;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.fullName.trim()) {
            setError('Please enter the full name.');
            return;
        }

        setSubmitting(true);
        setUploadProgress('Preparing...');

        try {
            const memorialRef = doc(db, 'memorials', id);
            let finalImageUrls = [...existingPhotos];

            if (newPhotoFiles.length > 0) {
                for (let i = 0; i < newPhotoFiles.length; i++) {
                    setUploadProgress(`Uploading new photo ${i + 1} of ${newPhotoFiles.length}...`);
                    const url = await uploadToCloudinary(newPhotoFiles[i]);
                    finalImageUrls.push(url);
                }
            }

            setUploadProgress('Saving to database...');

            // We explicitly DO NOT update status or isApproved fields per firestore.rules
            const updateData = {
                fullName: form.fullName.trim(),
                familyHouse: form.familyHouse.trim() || null,
                dateOfPassing: form.dateOfPassing || null,
                biography: form.biography.trim(),
                relationship: form.relationship.trim(),
                imageUrls: finalImageUrls.length > 0 ? finalImageUrls : null,
                imageUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : null,
            };

            await updateDoc(memorialRef, updateData);

            setSuccess(true);
            setUploadProgress('');
            setTimeout(() => navigate('/notifications'), 1200);

        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update: ' + err.message);
        } finally {
            setSubmitting(false);
            setUploadProgress('');
        }
    }

    const totalUploadedPhotos = existingPhotos.length + newPhotoFiles.length;

    return (
        <div className="min-h-screen bg-cream-100">
            <div className="bg-forest-900 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="font-heading text-2xl font-bold text-cream-100">Edit Memorial</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4 sm:p-5 space-y-4">

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <span>❌ {error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                            <span>✅ Updated successfully! Returning...</span>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">Full Name *</label>
                        <input name="fullName" type="text" required value={form.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">Family House (Optional)</label>
                        <input name="familyHouse" type="text" value={form.familyHouse} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">Relationship *</label>
                        <input name="relationship" type="text" required value={form.relationship} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">Date of Passing</label>
                        <input name="dateOfPassing" type="date" value={form.dateOfPassing} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">Biography</label>
                        <textarea name="biography" rows={4} value={form.biography} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none text-sm resize-none" />
                    </div>

                    {/* Photos */}
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-2">
                            Memorial Photos <span className="text-forest-500 font-normal">({totalUploadedPhotos} / {MAX_PHOTOS})</span>
                        </label>

                        <div className="flex gap-2 mb-3 flex-wrap">
                            {/* Existing Photos */}
                            {existingPhotos.map((url, idx) => (
                                <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-cream-300 flex-shrink-0">
                                    <img src={url} alt="Existing" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeExistingPhoto(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-[10px]">✕</button>
                                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-forest-800/80 text-center"><span className="text-[9px] text-cream-200">Main</span></div>}
                                </div>
                            ))}
                            {/* New Previews */}
                            {newPhotoPreviews.map((preview, idx) => (
                                <div key={`new-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-cream-300 flex-shrink-0">
                                    <img src={preview} alt="New" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeNewPhoto(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-[10px]">✕</button>
                                    <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] px-1 rounded">New</div>
                                </div>
                            ))}
                        </div>

                        {totalUploadedPhotos < MAX_PHOTOS && (
                            <label className="block cursor-pointer border-2 border-dashed border-cream-300 hover:border-forest-500 rounded-xl px-4 py-3 text-center transition-colors">
                                <span className="text-xs text-forest-700 font-medium">+ Add more photos</span>
                                <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoSelect} />
                            </label>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => navigate('/notifications')} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-cream-300 text-forest-700 font-semibold text-sm hover:bg-cream-50 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || success} className="flex-1 py-2.5 rounded-xl bg-forest-800 text-cream-100 font-bold text-sm hover:bg-forest-700 transition-colors disabled:opacity-50 shadow-md">
                            {submitting ? (uploadProgress || 'Saving...') : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
