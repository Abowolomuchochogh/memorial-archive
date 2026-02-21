import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

const CLOUDINARY_CLOUD_NAME = 'dkinpssee';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'wolo_uploads'; // Must be created as "Unsigned" in Cloudinary Settings > Upload Presets
const MAX_PHOTOS = 3;

export default function Upload() {
    const { currentUser, isAdmin, isDisabled } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: '',
        familyHouse: '',
        dateOfPassing: '',
        biography: '',
        relationship: '',
    });

    // Multi-image state (up to 3)
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [legacyDocFile, setLegacyDocFile] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');





    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handlePhotoSelect(e) {
        const selectedFiles = Array.from(e.target.files || []);
        const totalAllowed = MAX_PHOTOS - photoFiles.length;
        const newFiles = selectedFiles.slice(0, totalAllowed);

        if (newFiles.length === 0) return;

        const updatedFiles = [...photoFiles, ...newFiles];
        const newPreviews = newFiles.map(f => URL.createObjectURL(f));
        const updatedPreviews = [...photoPreviews, ...newPreviews];

        setPhotoFiles(updatedFiles);
        setPhotoPreviews(updatedPreviews);

        // Reset the input so the same file can be re-selected
        e.target.value = '';
    }

    function removePhoto(index) {
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    }

    function handleDocChange(e) {
        setLegacyDocFile(e.target.files[0] || null);
    }

    // Clean up preview URLs on unmount
    useEffect(() => {
        return () => {
            photoPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Protected Route: Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (isDisabled) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">Account Restricted</h2>
                    <p className="text-forest-700/70 text-sm">Your account has been temporarily restricted by an administrator. You cannot submit memorials at this time.</p>
                    <p className="text-forest-600/50 text-xs mt-3">Please contact the admin for more information.</p>
                </div>
            </div>
        );
    }

    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
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
            setError('Please enter the full name of the deceased.');
            return;
        }

        if (!form.relationship.trim()) {
            setError('Please specify your relationship.');
            return;
        }

        setSubmitting(true);
        setUploadProgress('Preparing...');

        try {
            const newMemorialRef = doc(collection(db, 'memorials'));
            let imageUrls = [];
            let legacyDocUrl = null;

            // Step 1: Upload all photos to Cloudinary
            if (photoFiles.length > 0) {
                for (let i = 0; i < photoFiles.length; i++) {
                    setUploadProgress(`Uploading photo ${i + 1} of ${photoFiles.length}...`);
                    const url = await uploadToCloudinary(photoFiles[i]);
                    imageUrls.push(url);

                }
            }

            // Step 2: Upload document to Cloudinary (optional)
            if (legacyDocFile) {
                setUploadProgress('Uploading document...');
                const docFormData = new FormData();
                docFormData.append('file', legacyDocFile);
                docFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                docFormData.append('folder', 'wolo_documents');
                docFormData.append('resource_type', 'auto');

                const docRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
                    { method: 'POST', body: docFormData }
                );
                if (docRes.ok) {
                    const docData = await docRes.json();
                    legacyDocUrl = docData.secure_url;

                }
            }

            // Step 3: Save to Firestore "memorials" collection
            setUploadProgress('Saving to database...');
            const memorialData = {
                fullName: form.fullName.trim(),
                familyHouse: form.familyHouse.trim() || null,
                dateOfPassing: form.dateOfPassing || null,
                biography: form.biography.trim(),
                // Backward compat: keep imageUrl as the first image
                imageUrl: imageUrls[0] || null,
                // New: array of all image URLs
                imageUrls: imageUrls.length > 0 ? imageUrls : null,
                legacyDocumentUrl: legacyDocUrl,
                relationship: form.relationship.trim(),
                // Audio tribute (optional Cloudinary URL)
                audioTributeUrl: null,
                postedBy: currentUser.uid,
                postedByName: currentUser.displayName || currentUser.email || 'Unknown',
                postedByEmail: currentUser.email || null,
                candlesLit: 0,
                status: isAdmin ? 'approved' : 'pending',
                isApproved: isAdmin ? true : false,
                createdAt: serverTimestamp(),
            };



            try {
                await setDoc(newMemorialRef, memorialData);

                // Notify all admins if a non-admin user submitted this
                if (!isAdmin) {
                    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
                    const adminDocs = await getDocs(adminsQuery);

                    if (!adminDocs.empty) {
                        const batch = writeBatch(db);
                        adminDocs.forEach(adminDoc => {
                            const adminId = adminDoc.id;
                            const notifRef = doc(collection(db, 'notifications'));
                            batch.set(notifRef, {
                                userId: adminId,
                                type: 'admin_alert',
                                message: `${currentUser.displayName || currentUser.email} has submitted a new memorial for ${form.fullName.trim()} that requires your review.`,
                                memorialId: newMemorialRef.id,
                                memorialName: form.fullName.trim(),
                                isRead: false,
                                createdAt: serverTimestamp(),
                            });
                        });
                        await batch.commit();
                    }
                }
            } catch (firestoreErr) {
                console.error('❌ Firestore save failed:', firestoreErr);
                alert('Firestore error: ' + firestoreErr.message);
                throw firestoreErr;
            }

            // Step 4: Success — only shows AFTER Firestore confirms
            setSuccess(true);
            setUploadProgress('');
            setTimeout(() => navigate('/archive'), 1200);

        } catch (err) {
            console.error('❌ Upload error:', err);
            setError('Failed: ' + err.message);
        } finally {
            setSubmitting(false);
            setUploadProgress('');
        }
    }

    return (
        <div className="min-h-screen bg-cream-100">
            <div className="bg-forest-900 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-cream-100 mb-1">
                        Submit a Memorial
                    </h1>
                    <p className="text-cream-200/80 text-sm">
                        Honour a loved one who has returned to Allah ﷻ
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4 sm:p-5 space-y-3.5">

                    {/* Success Message */}
                    {success && (
                        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>Memorial submitted! Redirecting to Tribute Wall...</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                            <span className="text-lg">❌</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Full Name of Deceased */}
                    <div>
                        <label htmlFor="fullName" className="block text-xs font-semibold text-forest-900 mb-1">
                            Full Name of Deceased <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11px] text-forest-600/60 mb-1">Enter the name of the person being memorialised, not your own name.</p>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="e.g. Alhaji Muhammad Ibrahim"
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 text-sm"
                        />
                    </div>

                    {/* Family House */}
                    <div>
                        <label htmlFor="familyHouse" className="block text-xs font-semibold text-forest-900 mb-1">
                            Family House <span className="text-xs font-normal text-forest-500">(Optional)</span>
                        </label>
                        <input
                            id="familyHouse"
                            name="familyHouse"
                            type="text"
                            value={form.familyHouse}
                            onChange={handleChange}
                            placeholder="e.g. Baitul Aman, Zongo Lane"
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 text-sm"
                        />
                    </div>

                    {/* Relationship */}
                    <div>
                        <label htmlFor="relationship" className="block text-xs font-semibold text-forest-900 mb-1">
                            Relationship <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="relationship"
                            name="relationship"
                            type="text"
                            required
                            value={form.relationship}
                            onChange={handleChange}
                            placeholder="e.g. Son, Daughter, Neighbor"
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 text-sm"
                        />
                    </div>

                    {/* Date of Passing */}
                    <div>
                        <label htmlFor="dateOfPassing" className="block text-xs font-semibold text-forest-900 mb-1">
                            Date of Passing
                        </label>
                        <input
                            id="dateOfPassing"
                            name="dateOfPassing"
                            type="date"
                            value={form.dateOfPassing}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 text-sm"
                        />
                    </div>

                    {/* Multi-Photo Upload with Preview */}
                    <div>
                        <label className="block text-xs font-semibold text-forest-900 mb-1">
                            Memorial Photos <span className="text-xs font-normal text-forest-500">(up to {MAX_PHOTOS})</span>
                        </label>

                        {/* Photo previews grid */}
                        {photoPreviews.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {photoPreviews.map((preview, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-cream-300 flex-shrink-0">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-[10px]"
                                        >
                                            ✕
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-forest-800/80 text-center">
                                                <span className="text-[9px] text-cream-200 font-medium">Main</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add more photos button */}
                        {photoFiles.length < MAX_PHOTOS && (
                            <label htmlFor="photo-upload" className="block cursor-pointer border-2 border-dashed border-cream-300 hover:border-forest-500 rounded-xl px-4 py-4 text-center transition-colors">
                                <svg className="mx-auto h-6 w-6 text-gray-400 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-xs text-forest-700 font-medium">
                                    {photoFiles.length === 0 ? 'Tap to select photos' : `Add more (${MAX_PHOTOS - photoFiles.length} remaining)`}
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG up to 10MB each</p>
                            </label>
                        )}
                        <input
                            id="photo-upload"
                            name="photo"
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handlePhotoSelect}
                        />
                    </div>

                    {/* Legacy Document — Completely Optional */}
                    <div>
                        <label htmlFor="legacyDoc" className="block text-xs font-semibold text-forest-900 mb-1">
                            Document <span className="text-xs font-normal text-forest-500">(Optional)</span>
                        </label>
                        <input
                            id="legacyDoc"
                            name="legacyDoc"
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={handleDocChange}
                            className="block w-full text-xs text-forest-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-forest-100 file:text-forest-800 hover:file:bg-forest-200"
                        />
                        {legacyDocFile && (
                            <p className="mt-1 text-xs text-forest-700">📄 {legacyDocFile.name}</p>
                        )}
                    </div>


                    {/* Biography */}
                    <div>
                        <label htmlFor="biography" className="block text-xs font-semibold text-forest-900 mb-1">
                            Biography
                        </label>
                        <textarea
                            id="biography"
                            name="biography"
                            rows={3}
                            value={form.biography}
                            onChange={handleChange}
                            placeholder="Share their story..."
                            className="w-full px-3 py-2 rounded-lg border border-cream-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all text-forest-900 placeholder-forest-600/40 text-sm resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || success}
                        className="w-full py-2.5 rounded-xl bg-forest-800 text-cream-100 font-bold text-sm hover:bg-forest-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                {uploadProgress || 'Submitting...'}
                            </span>
                        ) : success ? (
                            <span className="flex items-center justify-center gap-2">
                                ✅ Submitted!
                            </span>
                        ) : (
                            'Submit Memorial'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
