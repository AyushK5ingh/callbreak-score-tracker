import { db } from './firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

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
    const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    return snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore read failed:', err.message);
    return [];
  }
};

const deleteFromFirestore = async (docId) => {
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTION, docId));
  } catch (err) {
    console.warn('Firestore delete failed:', err.message);
  }
};

// ─── Public API ─────────────────────────────────────────────────

export const getHistory = () => {
  return getLocalHistory();
};

/**
 * Save a brand new game (first round just played)
 */
export const saveGame = (game) => {
  saveLocal(game);
  saveToFirestore(game);
};

/**
 * Update an existing game in localStorage by timestamp
 */
export const updateGame = (timestamp, updates) => {
  const history = getLocalHistory();
  const updated = history.map(g => {
    if (g.timestamp === timestamp) {
      return { ...g, ...updates };
    }
    return g;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Also push update to Firestore
  saveToFirestore({ ...updates, timestamp });
};

/**
 * Get ALL in-progress games (for multiple continue buttons)
 */
export const getInProgressGames = () => {
  const history = getLocalHistory();
  return history.filter(g => g.status === 'in-progress');
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
 * Sync: Pull cloud data into localStorage, then CLEAR cloud
 * Cloud is used as temporary transport only
 */
export const syncFromCloud = async () => {
  try {
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
          // Remove internal _docId before saving locally
          const { _docId, ...gameData } = game;
          localHistory.push(gameData);
          newGames++;
        }
      });

      if (newGames > 0) {
        localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localHistory));
        console.log(`☁️ Merged ${newGames} new games from cloud`);
      }

      // --- Clear cloud after pulling ---
      let deleted = 0;
      for (const game of cloudGames) {
        if (game._docId) {
          await deleteFromFirestore(game._docId);
          deleted++;
        }
      }
      if (deleted > 0) {
        console.log(`☁️ Cleared ${deleted} games from cloud (data is local now)`);
      }
    }

    // --- Push: send local-only games to cloud for other devices ---
    let pushed = 0;
    for (const game of localHistory) {
      // Only push games that weren't already in cloud
      const wasInCloud = cloudGames.some(cg => cg.timestamp === game.timestamp);
      if (!wasInCloud) {
        await saveToFirestore(game);
        pushed++;
      }
    }
    if (pushed > 0) {
      console.log(`☁️ Pushed ${pushed} local games to cloud for other devices`);
    }

    return { synced: true, count: newGames };
  } catch (err) {
    console.warn('Cloud sync failed:', err.message);
    return { synced: false, count: 0 };
  }
};

export const getPlayerStats = () => {
  const history = getLocalHistory().filter(g => g.status === 'completed');
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
