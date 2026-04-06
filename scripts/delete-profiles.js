#!/usr/bin/env node
import readline from 'readline/promises';
import { stdin, stdout } from 'process';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// This script deletes all documents in `users/{uid}/profiles` for the signed-in user.
// Usage:
// 1) Create a .env in the project root with your Firebase config (see README or VITE_FIREBASE_* vars),
//    or export the env vars in your shell before running.
// 2) Run: `node scripts/delete-profiles.js`

const envVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missing = envVars.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing Firebase env vars:', missing.join(', '));
  console.error('Please set those env vars or create a .env file with them and re-run.');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore();

const rl = readline.createInterface({ input: stdin, output: stdout });

async function promptCredentials() {
  const email = await rl.question('Firebase email: ');
  const password = await rl.question('Firebase password: ');
  return { email: email.trim(), password: password.trim() };
}

async function confirm(prompt) {
  const ans = await rl.question(`${prompt} `);
  return ans.trim().toLowerCase();
}

async function main() {
  try {
    const { email, password } = await promptCredentials();
    console.log('Signing in...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    console.log('Signed in as', cred.user.email, 'uid=', uid);

    const profilesCol = collection(db, 'users', uid, 'profiles');
    const snap = await getDocs(profilesCol);
    if (snap.empty) {
      console.log('No profiles found for this user.');
      await fbSignOut(auth);
      rl.close();
      return;
    }

    console.log(`Found ${snap.size} profile(s):`);
    snap.docs.forEach(d => console.log('-', d.id, d.data()));

    const answer = await confirm('Type YES to delete ALL profiles for this user:');
    if (answer !== 'yes') {
      console.log('Aborted. No changes made.');
      await fbSignOut(auth);
      rl.close();
      return;
    }

    console.log('Deleting...');
    for (const d of snap.docs) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'profiles', d.id));
        console.log('Deleted', d.id);
      } catch (err) {
        console.error('Failed to delete', d.id, err);
      }
    }

    console.log('Done. Signing out.');
    await fbSignOut(auth);
    rl.close();
  } catch (err) {
    console.error('Error:', err);
    rl.close();
    process.exit(1);
  }
}

main();
