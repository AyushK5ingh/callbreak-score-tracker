import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'callbreak_history';
const FIRESTORE_COLLECTION = 'games';

// ─── Local Storage (immediate, offline) ──────────────────────────

const getLocalHistory = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocal = (game) => {
  const history = getLocalHistory();
  history.unshift(game);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

// ─── Firestore (cloud sync) ─────────────────────────────────────

const saveToFirestore = async (game) => {
  try {
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTION), {
      ...game,
      createdAt: new Date().toISOString(),
    });
    console.log('☁️ Saved to Firestore:', docRef.id);
  } catch (err) {
    console.warn('Firestore save failed (will retry when online):', err.message);
  }
};

const getFirestoreHistory = async () => {
  try {
    // Simple getDocs without orderBy — avoids needing a Firestore index
    const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Firestore read failed:', err.message);
    return [];
  }
};

// ─── Public API (dual-write) ────────────────────────────────────

export const getHistory = () => {
  return getLocalHistory();
};

export const saveGame = (game) => {
  // 1. Save to localStorage immediately (instant, works offline)
  saveLocal(game);
  // 2. Save to Firestore (syncs when online)
  saveToFirestore(game);
};

/**
 * Toggle a game as insignificant (practice / doesn't count)
 */
export const toggleInsignificant = (timestamp) => {
  const history = getLocalHistory();
  const updated = history.map(g => {
    if (g.timestamp === timestamp) {
      return { ...g, insignificant: !g.insignificant };
    }
    return g;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Sync: Pull cloud data into localStorage
 * Call this on app startup to merge any games from other devices
 */
export const syncFromCloud = async () => {
  try {
    // Timeout after 8 seconds
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    const cloudGames = await Promise.race([getFirestoreHistory(), timeout]);
    
    console.log(`☁️ Cloud returned ${cloudGames.length} games`);

    const localHistory = getLocalHistory();

    // --- Pull: merge cloud games into local ---
    let newGames = 0;
    if (cloudGames.length > 0) {
      const localTimestamps = new Set(localHistory.map(g => g.timestamp));
      cloudGames.forEach(game => {
        if (!localTimestamps.has(game.timestamp)) {
          localHistory.push(game);
          newGames++;
        }
      });

      if (newGames > 0) {
        localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localHistory));
        console.log(`☁️ Merged ${newGames} new games from cloud`);
      }
    }

    // --- Push: send local-only games to cloud ---
    const cloudTimestamps = new Set(cloudGames.map(g => g.timestamp));
    let pushed = 0;
    for (const game of localHistory) {
      if (!cloudTimestamps.has(game.timestamp)) {
        await saveToFirestore(game);
        pushed++;
      }
    }
    if (pushed > 0) {
      console.log(`☁️ Pushed ${pushed} local games to cloud`);
    }

    return { synced: true, count: newGames };
  } catch (err) {
    console.warn('Cloud sync failed:', err.message);
    return { synced: false, count: 0 };
  }
};

export const getPlayerStats = () => {
  const history = getLocalHistory();
  const stats = {
    Ayush: { '1st': 0, '2nd': 0, '3rd': 0 },
    Mohit: { '1st': 0, '2nd': 0, '3rd': 0 },
    Harsh: { '1st': 0, '2nd': 0, '3rd': 0 },
  };

  history.forEach(game => {
    const sorted = [...game.totals].sort((a, b) => b.score - a.score);
    sorted.forEach((p, index) => {
      const pos = index === 0 ? '1st' : index === 1 ? '2nd' : '3rd';
      if (stats[p.name]) {
        stats[p.name][pos]++;
      }
    });
  });

  return stats;
};
