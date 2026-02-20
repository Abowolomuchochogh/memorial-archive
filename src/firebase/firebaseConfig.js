import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAn6apvV6E4nrCU15vmgOWWtvyk2_Dr13w",
    authDomain: "wolo-5fbcd.firebaseapp.com",
    projectId: "wolo-5fbcd",
    storageBucket: "wolo-5fbcd.firebasestorage.app",
    messagingSenderId: "1010068919589",
    appId: "1:1010068919589:web:2d20b2a239b2b83a4e36cc"
};

import { getStorage } from "firebase/storage";

// ... existing code ...

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
