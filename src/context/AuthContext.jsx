import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Firestore profile data (role, etc.)
    const [loading, setLoading] = useState(true);

    async function signup(email, password, displayName, location, phoneNumber, communityReference) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });

        // Create user document with all details
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email,
            displayName,
            location: location || null,
            phoneNumber: phoneNumber || null,
            communityReference: communityReference || null,
            role: 'member',
            isVerified: false, // Explicitly false
            isDisabled: false,
            createdAt: new Date().toISOString(),
        });
        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Check if user profile exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // New Google user - create profile
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Google User',
                location: null,
                phoneNumber: user.phoneNumber || null,
                communityReference: 'Google Sign-In',
                role: 'member',
                isVerified: false,
                isDisabled: false,
                createdAt: new Date().toISOString(),
            });
        }

        return userCredential;
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setUserProfile(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        let unsubscribeProfile = () => { };

        if (currentUser) {
            setLoading(true);
            const userRef = doc(db, 'users', currentUser.uid);
            unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setLoading(false);
            });
        }

        return () => {
            unsubscribeProfile();
        };
    }, [currentUser]);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        signInWithGoogle,
        logout,
        loading,
        isAdmin: userProfile?.role === 'admin' || userProfile?.isAdmin === true,
        isDisabled: userProfile?.isDisabled === true,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
