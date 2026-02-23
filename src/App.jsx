import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import GameSession from './components/GameSession';
import HistoryView from './components/HistoryView';
import { syncFromCloud } from './utils/storage';

function App() {
  const [view, setView] = useState('home'); // home, game, history

  // Sync cloud data on app startup
  useEffect(() => {
    syncFromCloud().then(result => {
      if (result.synced && result.count > 0) {
        console.log(`☁️ Synced ${result.count} games from cloud`);
      }
    });
  }, []);

  const navigateTo = (newView) => setView(newView);

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-emerald-500/30">
      {view === 'home' && <HomeView onNavigate={navigateTo} />}
      {view === 'game' && <GameSession onNavigate={navigateTo} />}
      {view === 'history' && <HistoryView onNavigate={navigateTo} />}
    </div>
  );
}

export default App;

