import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export function usePushNotifications() {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        async function requestPermissionAndToken() {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Try to generate a VAPID key token if needed. We can also skip vapidKey to use default FCM gen.
                    // Replace 'YOUR_PUBLIC_VAPID_KEY_HERE' if you have one, or just call getToken(messaging) for default.
                    const currentToken = await getToken(messaging);

                    if (currentToken) {
                        // Save the token to the user's document
                        const userRef = doc(db, 'users', currentUser.uid);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            // Using arrayUnion ensures no duplicates are stored
                            await updateDoc(userRef, {
                                fcmTokens: arrayUnion(currentToken)
                            });
                        }
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                } else {
                    console.log('Notification permission not granted.');
                }
            } catch (err) {
                console.error('An error occurred while retrieving token:', err);
            }
        }

        requestPermissionAndToken();
    }, [currentUser]);

    return null;
}
