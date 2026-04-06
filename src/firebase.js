import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let app = null;
let auth = null;
let db = null;

const hasApiKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '');

if (hasApiKey) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize services inside try/catch to surface configuration errors
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('[firebase] initialization error:', err);
    // If auth initialization fails (e.g., auth/configuration-not-found), keep auth/db null
    auth = null;
    db = null;
  }
} else {
  // Avoid throwing during app startup when environment vars are missing (e.g., local dev without .env)
  // Consumers should check for `auth`/`db` being null and handle accordingly.
  // Provide stub functions that reject with a helpful message.
  console.warn('[firebase] VITE_FIREBASE_API_KEY not set — Firebase will not be initialized. Auth functions will reject.');
}

async function signUp(email, password) {
  if (!auth) {
    return Promise.reject(new Error('Firebase not configured: missing VITE_FIREBASE_API_KEY'));
  }
  return createUserWithEmailAndPassword(auth, email, password);
}

async function signIn(email, password) {
  if (!auth) {
    return Promise.reject(new Error('Firebase not configured: missing VITE_FIREBASE_API_KEY'));
  }
  return signInWithEmailAndPassword(auth, email, password);
}

async function signOut() {
  if (!auth) {
    return Promise.reject(new Error('Firebase not configured: missing VITE_FIREBASE_API_KEY'));
  }
  return fbSignOut(auth);
}

export { auth, db, signUp, signIn, signOut };
