import React from 'react';
import { Play, History, Award, ChevronRight, Cloud, CloudOff, Loader, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getInProgressGames } from '../utils/storage';
import { THEMES } from '../utils/themes';

const HomeView = ({ onNavigate, syncStatus, theme, setTheme }) => {
  const inProgressGames = getInProgressGames();

  const syncConfig = {
    syncing: { dot: 'bg-amber-500 animate-pulse', icon: <Loader className="w-3 h-3 text-amber-400 animate-spin" />, text: 'Syncing...', color: 'text-amber-500' },
    synced: { dot: 'bg-green-500', icon: <Cloud className="w-3 h-3 text-green-400" />, text: 'Cloud synced', color: 'text-green-500' },
    offline: { dot: 'bg-rose-500 animate-pulse', icon: <CloudOff className="w-3 h-3 text-rose-400" />, text: 'Offline mode', color: 'text-rose-400' },
  };
  const sync = syncConfig[syncStatus] || syncConfig.offline;

  return (
    <div className="flex flex-col min-h-screen bg-dark-900 px-6 py-12 font-outfit">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-16">
        <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center border border-white/5">
           <Award className="w-5 h-5 text-primary-500" />
        </div>
        <div className="w-10 h-10" /> {/* Placeholder */}
      </div>

      {/* Main Title */}
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Score<br /><span className="text-primary-500">Tracker</span>
        </h1>
        <p className="text-slate-500 font-medium">Ayush • Harsh • Mohit</p>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-20">
        {/* Continue buttons for ALL in-progress games */}
        {inProgressGames.map((game, idx) => (
          <motion.button
            key={game.timestamp}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('game', game)}
            className="w-full flex items-center justify-between p-5 bg-amber-600/90 rounded-[28px] shadow-xl shadow-amber-600/15 group overflow-hidden relative"
          >
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-0.5">Continue Game {inProgressGames.length > 1 ? `#${idx + 1}` : ''}</h2>
              <p className="text-amber-100/70 text-xs font-medium">
                R{game.rounds} • {game.totals.map(p => `${p.name[0]}: ${p.score}`).join(' · ')}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative z-10">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-white/5 rounded-full" />
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('game')}
          className="w-full flex items-center justify-between p-6 bg-primary-500 rounded-[28px] shadow-2xl shadow-primary-500/10 group overflow-hidden relative"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-1">New Game</h2>
            <p className="text-primary-100/70 text-sm font-medium">Start a fresh match</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('history')}
          className="w-full flex items-center justify-between p-6 bg-dark-800 border border-white/5 rounded-[28px] shadow-xl group transition-all"
        >
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-dark-700 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <History className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-white mb-1">History</h2>
              <p className="text-slate-500 text-sm font-medium">Recent matches</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-dark-700" />
        </motion.button>
      </div>

      {/* Theme Switcher */}
      <div className="mb-12">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 text-center">Visual Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(THEMES).map((t) => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(t.id)}
              className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${
                theme === t.id 
                  ? 'bg-primary-500/10 border-primary-500 text-white shadow-lg shadow-primary-500/10' 
                  : 'bg-dark-800 border-white/5 text-slate-400'
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-xs font-bold leading-none">{t.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom sync status */}
      <div className="mt-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-800/50 rounded-full border border-white/5">
          {sync.icon}
          <div className={`w-1.5 h-1.5 rounded-full ${sync.dot}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${sync.color}`}>{sync.text}</span>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
