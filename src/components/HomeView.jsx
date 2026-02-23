import React from 'react';
import { Play, History, Award, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const HomeView = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-dark-900 px-6 py-12 font-outfit">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-16">
        <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center border border-white/5">
           <Award className="w-5 h-5 text-primary-500" />
        </div>
        <button className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center border border-white/5 text-slate-400">
           <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Title */}
      <div className="mb-16">
        <h1 className="text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Score<br /><span className="text-primary-500">Tracker</span>
        </h1>
        <p className="text-slate-500 font-medium">Ayush • Harsh • Mohit</p>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 mb-20">
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
          {/* Subtle decoration */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('history')}
          className="w-full flex items-center justify-between p-6 bg-dark-800 border border-white/5 rounded-[28px] shadow-xl group"
        >
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-dark-700 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">History</h2>
              <p className="text-slate-500 text-sm font-medium">Recent matches</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-dark-700" />
        </motion.button>
      </div>

      {/* Bottom info */}
      <div className="mt-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-800/50 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Offline Edition v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
