import React from 'react';
import { ArrowLeft, Trophy, Calendar, User, TrendingUp, Award, Award as MedalIcon, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory, getPlayerStats } from '../utils/storage';

const HistoryView = ({ onNavigate }) => {
  const history = getHistory();
  const stats = getPlayerStats();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200 px-6 py-12 font-outfit">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => onNavigate('home')} className="w-10 h-10 bg-dark-800 border border-white/5 rounded-full flex items-center justify-center text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">Records</h2>
        <div className="w-10" />
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-12">
        {['Ayush', 'Harsh', 'Mohit'].map((name) => (
          <div key={name} className="bg-dark-800 border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{name}</p>
            <div className="space-y-1">
               <div className="flex items-center justify-center space-x-1">
                 <span className="text-base font-bold text-primary-500">{stats[name]['1st']}</span>
                 <span className="text-[8px] font-black text-slate-600 uppercase">1st</span>
               </div>
               <div className="flex items-center justify-center space-x-1 opacity-60">
                 <span className="text-xs font-bold text-blue-400">{stats[name]['2nd']}</span>
                 <span className="text-[8px] font-black text-slate-600 uppercase">2nd</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* History Feed */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <Hash className="w-4 h-4 text-primary-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Matches</h3>
        </div>

        {history.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
            <p className="text-slate-600 text-sm font-medium italic px-10">No matches recorded yet</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {history.map((game, i) => (
              <motion.div 
                key={i} 
                variants={item}
                className="bg-dark-800 border border-white/5 rounded-[32px] p-6 hover:bg-dark-700/50 transition-all group"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{new Date(game.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    {game.rounds} Rounds
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[...game.totals].sort((a,b) => b.score - a.score).map((p, idx) => (
                    <div key={p.name} className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.02]">
                      <span className={`text-[8px] font-black mb-1 ${idx === 0 ? 'text-primary-500' : 'text-slate-600'} uppercase`}>
                        {idx + 1}st
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mb-0.5">{p.name}</span>
                      <span className={`text-lg font-black ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>{p.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
