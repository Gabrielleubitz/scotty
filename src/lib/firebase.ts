import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase config from environment variables (with fallback for development)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCOQBT98TQumcTJnCcXSKE1B0sycQkpoo0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scotty-dccad.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scotty-dccad",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scotty-dccad.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "966416224400",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:966416224400:web:d0476a8418665d42a0c815",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VBCDSSQXR2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;