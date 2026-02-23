import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import GameSession from './components/GameSession';
import HistoryView from './components/HistoryView';

function App() {
  const [view, setView] = useState('home'); // home, game, history

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
