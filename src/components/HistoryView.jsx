import React, { useState, useCallback } from 'react';
import { ArrowLeft, Trophy, Calendar, Hash, TrendingUp, TrendingDown, EyeOff, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory, getPlayerStats, toggleInsignificant } from '../utils/storage';
import { getBidNicknames, getSkillNicknames, getComebackAndDownfall, getTrendData } from '../utils/analytics';

// Mini SVG Line Chart Component
const TrendChart = ({ data, height = 80 }) => {
  if (!data) return null;

  const players = ['Ayush', 'Harsh', 'Mohit'];
  const colors = { Ayush: '#059669', Harsh: '#3b82f6', Mohit: '#f97316' };
  const allValues = players.flatMap(name => data[name]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const numPoints = data['Ayush'].length;
  const width = 280;

  const getPath = (name) => {
    const points = data[name].map((val, i) => {
      const x = (i / (numPoints - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 10) - 5;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: `${height}px` }}>
      {/* Zero line */}
      {minVal < 0 && maxVal > 0 && (
        <line
          x1="0" y1={height - ((0 - minVal) / range) * (height - 10) - 5}
          x2={width} y2={height - ((0 - minVal) / range) * (height - 10) - 5}
          stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4"
        />
      )}
      {players.map(name => (
        <path
          key={name}
          d={getPath(name)}
          fill="none"
          stroke={colors[name]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      ))}
      {/* End dots */}
      {players.map(name => {
        const lastIdx = data[name].length - 1;
        const x = (lastIdx / (numPoints - 1)) * width;
        const y = height - ((data[name][lastIdx] - minVal) / range) * (height - 10) - 5;
        return <circle key={`${name}-dot`} cx={x} cy={y} r="4" fill={colors[name]} />;
      })}
    </svg>
  );
};

const HistoryView = ({ onNavigate }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const history = getHistory();
  const significantHistory = history.filter(g => !g.insignificant);
  const stats = getPlayerStats();
  const bidNicks = getBidNicknames(significantHistory);
  const skillNicks = getSkillNicknames(significantHistory);

  const handleToggleInsignificant = useCallback((timestamp) => {
    toggleInsignificant(timestamp);
    setRefreshKey(k => k + 1); // force re-render
  }, []);

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

  const NicknameBadge = ({ nick }) => {
    if (!nick || nick.label === 'New') return null;
    return (
      <span className={`text-[7px] font-black uppercase tracking-wider ${nick.color}`}>
        {nick.emoji} {nick.label}
      </span>
    );
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
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${name === 'Ayush' ? 'text-emerald-500' : name === 'Harsh' ? 'text-blue-500' : 'text-orange-500'}`}>{name}</p>
            <div className="flex flex-col items-center gap-0.5 mb-1">
              <NicknameBadge nick={bidNicks[name]} />
              <NicknameBadge nick={skillNicks[name]} />
            </div>
            <div className="space-y-1 mt-2">
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

      {/* Legend for trend chart */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        {[{ name: 'Ayush', color: 'bg-emerald-500' }, { name: 'Harsh', color: 'bg-blue-500' }, { name: 'Mohit', color: 'bg-orange-500' }].map(p => (
          <div key={p.name} className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${p.color}`} />
            <span className="text-[9px] font-bold text-slate-500 uppercase">{p.name}</span>
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
            {history.map((game, i) => {
              const analysis = getComebackAndDownfall(game);
              const trendData = getTrendData(game);

              return (
                <motion.div
                  key={i}
                  variants={item}
                  className={`bg-dark-800 border rounded-[32px] p-6 transition-all group ${game.insignificant ? 'border-white/5 opacity-40' : 'border-white/5 hover:bg-dark-700/50'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{new Date(game.timestamp).toLocaleDateString()}</span>
                      {game.insignificant && (
                        <span className="text-[7px] font-black text-rose-400 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">Practice</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleInsignificant(game.timestamp)}
                        className={`p-1.5 rounded-lg transition-all ${game.insignificant ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-slate-600 hover:text-slate-400'}`}
                        title={game.insignificant ? 'Mark as significant' : 'Mark as insignificant'}
                      >
                        {game.insignificant ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <div className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-widest">
                        {game.rounds} Rounds
                      </div>
                    </div>
                  </div>

                  {/* Trend Graph */}
                  {trendData && (
                    <div className="mb-4 p-3 bg-dark-900/50 rounded-2xl border border-white/5">
                      <TrendChart data={trendData} />
                    </div>
                  )}

                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[...game.totals].sort((a, b) => b.score - a.score).map((p, idx) => (
                      <div key={p.name} className="flex flex-col items-center p-2 rounded-2xl bg-white/[0.02]">
                        <span className={`text-[8px] font-black mb-1 ${idx === 0 ? 'text-primary-500' : 'text-slate-600'} uppercase`}>
                          {idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">{p.name}</span>
                        <span className={`text-lg font-black ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>{p.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Comeback / Downfall tags */}
                  <div className="flex flex-wrap gap-2">
                    {analysis.comeback && (
                      <div className="flex items-center space-x-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase">{analysis.comeback} — Comeback King 👑</span>
                      </div>
                    )}
                    {analysis.downfall && (
                      <div className="flex items-center space-x-1 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        <span className="text-[8px] font-black text-rose-400 uppercase">{analysis.downfall} — Downfall 📉</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
