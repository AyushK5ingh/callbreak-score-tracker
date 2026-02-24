import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "callbreak-tracker-af955.firebaseapp.com",
  projectId: "callbreak-tracker-af955",
  storageBucket: "callbreak-tracker-af955.firebasestorage.app",
  messagingSenderId: "348079748344",
  appId: "1:348079748344:web:c4dfa897bc9c1cf0a6770d"
};

const app = initializeApp(firebaseConfig);

// New API — replaces deprecated enableIndexedDbPersistence()
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export default app;
