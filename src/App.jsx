import React, { useState, useEffect, useCallback } from 'react';
import HomeView from './components/HomeView';
import GameSession from './components/GameSession';
import HistoryView from './components/HistoryView';
import PullToRefresh from './components/PullToRefresh';
import { syncFromCloud } from './utils/storage';

function App() {
  const [view, setView] = useState('home');
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [resumeGame, setResumeGame] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('cb-theme') || 'default');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cb-theme', theme);
  }, [theme]);

  // Reusable sync function
  const refreshSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const result = await syncFromCloud();
      if (result.synced) {
        setSyncStatus('synced');
        if (result.count > 0) {
          console.log(`☁️ Synced ${result.count} games from cloud`);
        }
      } else {
        setSyncStatus('offline');
      }
    } catch {
      setSyncStatus('offline');
    }
  }, []);

  // Sync cloud data on app startup
  useEffect(() => {
    refreshSync();
  }, [refreshSync]);

  // Sync when app comes back to foreground (tab switch, APK resume)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refreshSync]);

  const navigateTo = (newView, data) => {
    if (newView === 'game' && data) {
      setResumeGame(data);
    } else {
      setResumeGame(null);
    }
    setView(newView);
  };

  return (
    <PullToRefresh onRefresh={refreshSync}>
      <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-amber-500/30">
        {view === 'home' && <HomeView onNavigate={navigateTo} syncStatus={syncStatus} theme={theme} setTheme={setTheme} />}
        {view === 'game' && <GameSession key={resumeGame?.timestamp || 'new'} onNavigate={navigateTo} resumeGame={resumeGame} currentTheme={theme} />}
        {view === 'history' && <HistoryView onNavigate={navigateTo} />}
      </div>
    </PullToRefresh>
  );
}

export default App;
