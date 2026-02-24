import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import GameSession from './components/GameSession';
import HistoryView from './components/HistoryView';
import { syncFromCloud, getInProgressGame } from './utils/storage';

function App() {
  const [view, setView] = useState('home');
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [resumeGame, setResumeGame] = useState(null);

  // Sync cloud data on app startup
  useEffect(() => {
    setSyncStatus('syncing');
    syncFromCloud().then(result => {
      if (result.synced) {
        setSyncStatus('synced');
        if (result.count > 0) {
          console.log(`☁️ Synced ${result.count} games from cloud`);
        }
      } else {
        setSyncStatus('offline');
      }
    }).catch(() => {
      setSyncStatus('offline');
    });
  }, []);

  const navigateTo = (newView, data) => {
    if (newView === 'game' && data) {
      setResumeGame(data);
    } else {
      setResumeGame(null);
    }
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-amber-500/30">
      {view === 'home' && <HomeView onNavigate={navigateTo} syncStatus={syncStatus} />}
      {view === 'game' && <GameSession key={resumeGame?.timestamp || 'new'} onNavigate={navigateTo} resumeGame={resumeGame} />}
      {view === 'history' && <HistoryView onNavigate={navigateTo} />}
    </div>
  );
}

export default App;
