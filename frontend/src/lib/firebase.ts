import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Import the functions you need from the SDKs you need

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDyN1lJLSLOFzcopfRK3PZi92B1CFT54A0",
    authDomain: "synaphack-b2311.firebaseapp.com",
    projectId: "synaphack-b2311",
    storageBucket: "synaphack-b2311.firebasestorage.app",
    messagingSenderId: "43881455288",
    appId: "1:43881455288:web:f68fab3a8bcd886d17de4d",
    measurementId: "G-LR3K4ML0WF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Only initialize analytics if supported (client-side)
export const analytics = typeof window !== 'undefined' ? 
    isSupported().then(yes => yes ? getAnalytics(app) : null) : 
    null;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
