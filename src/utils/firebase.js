import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "callbreak-tracker-af955.firebaseapp.com",
  projectId: "callbreak-tracker-af955",
  storageBucket: "callbreak-tracker-af955.firebasestorage.app",
  messagingSenderId: "348079748344",
  appId: "1:348079748344:web:c4dfa897bc9c1cf0a6770d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence — Firestore will cache locally and sync when online
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

export default app;
