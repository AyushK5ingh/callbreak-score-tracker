import { db } from './firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY = 'callbreak_history';
const FIRESTORE_COLLECTION = 'games';

// ─── Local Storage (immediate, offline) ──────────────────────────

const getLocalHistory = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalHistory = (history) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const saveLocal = (game) => {
  const history = getLocalHistory();
  // Ensure we don't duplicate if already exists (e.g. during sync)
  if (!history.find(g => g.timestamp === game.timestamp)) {
    history.unshift(game);
    saveLocalHistory(history);
  }
};

// ─── Firestore (cloud sync) ─────────────────────────────────────

const saveToFirestore = async (game) => {
  try {
    // Only push essential fields to cloud (exclude internal flags)
    const { cloudSynced, _docId, ...gameToPush } = game;
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTION), {
      ...gameToPush,
      createdAt: new Date().toISOString(),
    });
    console.log('☁️ Saved to Firestore:', docRef.id);
    return true;
  } catch (err) {
    console.warn('Firestore save failed (will retry when online):', err.message);
    return false;
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
  saveLocal({ ...game, cloudSynced: false });
  saveToFirestore(game);
};

/**
 * Update an existing game in localStorage by timestamp
 */
export const updateGame = (timestamp, updates) => {
  const history = getLocalHistory();
  const updated = history.map(g => {
    if (g.timestamp === timestamp) {
      return { ...g, ...updates, cloudSynced: false }; // Mark for re-pushing
    }
    return g;
  });
  saveLocalHistory(updated);
  // Also push update to Firestore (queued)
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
  saveLocalHistory(updated);
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

    let localHistory = getLocalHistory();
    let localChanged = false;

    // --- 1. Pull: merge cloud games into local ---
    if (cloudGames.length > 0) {
      const localTimestamps = new Set(localHistory.map(g => g.timestamp));
      cloudGames.forEach(game => {
        if (!localTimestamps.has(game.timestamp)) {
          // Remove internal _docId before saving locally
          const { _docId, ...gameData } = game;
          // Mark as synced since it came FROM the cloud
          localHistory.push({ ...gameData, cloudSynced: true });
          localChanged = true;
        }
      });

      if (localChanged) {
        localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        saveLocalHistory(localHistory);
        console.log(`☁️ Merged new games from cloud`);
      }

      // --- 2. Clear cloud after pulling ---
      // We only clear what we just saw to avoid deleting games pushed while we were merging
      for (const game of cloudGames) {
        if (game._docId) {
          await deleteFromFirestore(game._docId);
        }
      }
      console.log(`☁️ Cleared sync bridge`);
    }

    // --- 3. Push: send unsynced local games to cloud ---
    // A game needs pushing if cloudSynced is false OR it wasn't in the cloud snapshot we just got
    let pushedCount = 0;
    const cloudTimestamps = new Set(cloudGames.map(cg => cg.timestamp));
    
    const updatedHistory = localHistory.map(game => {
      if (!game.cloudSynced && !cloudTimestamps.has(game.timestamp)) {
        saveToFirestore(game); // Fire and forget
        pushedCount++;
        return { ...game, cloudSynced: true };
      }
      return game;
    });

    if (pushedCount > 0) {
      saveLocalHistory(updatedHistory);
      console.log(`☁️ Pushed ${pushedCount} games to cloud bridge`);
    }

    return { synced: true, count: cloudGames.length };
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
