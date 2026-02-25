import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Save, Lock, AlertCircle, CheckCircle2, Trophy, Moon, Flag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateRoundScore, validateHands, getLeaderAndDiffs } from '../utils/gameLogic';
import { saveGame, updateGame } from '../utils/storage';
import { triggerHaptic, playSound } from '../utils/feedback';

const NicknameBadge = ({ nick }) => {
  if (!nick) return null;
  return (
    <span className={`text-[7px] font-black uppercase tracking-wider ${nick.color}`}>
      {nick.emoji} {nick.label}
    </span>
  );
};

const GameSession = ({ onNavigate, resumeGame, currentTheme }) => {
  // If resuming, hydrate from saved game; otherwise start fresh
  const [players, setPlayers] = useState(
    resumeGame ? resumeGame.totals : [
      { name: 'Ayush', score: 0 },
      { name: 'Harsh', score: 0 },
      { name: 'Mohit', score: 0 },
    ]
  );
  const [rounds, setRounds] = useState(resumeGame ? resumeGame.roundDetails : []);
  const [currentRound, setCurrentRound] = useState({ bids: { Ayush: '', Harsh: '', Mohit: '' }, hands: { Ayush: '', Harsh: '', Mohit: '' } });
  const [phase, setPhase] = useState('bid');
  const [popup, setPopup] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [negativeRoast, setNegativeRoast] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [dealerIndex, setDealerIndex] = useState(rounds.length % 3);
  const [editingRoundIndex, setEditingRoundIndex] = useState(null);
  // Stable timestamp for this game session
  const gameTimestamp = useRef(resumeGame ? resumeGame.timestamp : new Date().toISOString());

  // Sound wrapping
  const playSfx = (type) => playSound(type, currentTheme);

  const playersWithDiffs = getLeaderAndDiffs(players);
  const leader = [...playersWithDiffs].sort((a, b) => b.score - a.score)[0];

  // Live nicknames computed from current match rounds
  const liveNicknames = useMemo(() => {
    const names = ['Ayush', 'Harsh', 'Mohit'];
    const bidNicks = {};
    const skillNicks = {};

    if (rounds.length === 0) {
      names.forEach(n => {
        bidNicks[n] = null;
        skillNicks[n] = null;
      });
      return { bidNicks, skillNicks };
    }

    names.forEach(name => {
      let bidSum = 0, marginSum = 0, count = 0;
      rounds.forEach(r => {
        const bid = parseInt(r.bids[name] || 0);
        const hand = parseInt(r.hands[name] || 0);
        if (bid > 0) {
          bidSum += bid;
          marginSum += (hand - bid);
          count++;
        }
      });

      if (count === 0) {
        bidNicks[name] = null;
        skillNicks[name] = null;
        return;
      }

      const avgBid = bidSum / count;
      const avgMargin = marginSum / count;

      // Bid-level nickname
      if (avgBid >= 6) bidNicks[name] = { label: 'Luckboy', emoji: '🍀', color: 'text-green-400' };
      else if (avgBid <= 3) bidNicks[name] = { label: 'Bechara', emoji: '😢', color: 'text-amber-400' };
      else bidNicks[name] = { label: 'NPC', emoji: '🤖', color: 'text-slate-500' };

      // Skill-level nickname
      if (avgMargin <= 1) skillNicks[name] = { label: 'Aggressor', emoji: '🔥', color: 'text-red-400' };
      else if (avgMargin >= 2.5) skillNicks[name] = { label: 'Safeboy', emoji: '🛡️', color: 'text-blue-400' };
      else skillNicks[name] = { label: 'Balanced', emoji: '⚖️', color: 'text-slate-500' };
    });

    return { bidNicks, skillNicks };
  }, [rounds]);

  useEffect(() => {
    let interval;
    if (timerActive && popup && popup.countdown > 0) {
      interval = setInterval(() => {
        setPopup(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    } else if (popup && popup.countdown === 0) {
      setTimerActive(false);
      // Auto-confirm based on popup type
      if (popup.type === 'bid') {
        confirmBids();
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, popup]);

  const validateBidRange = (bids) => {
    const invalid = Object.entries(bids).filter(([, v]) => {
      const n = parseInt(v);
      return isNaN(n) || n < 2 || n > 17;
    });
    return invalid.length === 0 ? null : invalid.map(([name]) => name);
  };

  const validateHandRange = (hands) => {
    const invalid = Object.entries(hands).filter(([, v]) => {
      const n = parseInt(v);
      return isNaN(n) || n < 0 || n > 17;
    });
    return invalid.length === 0 ? null : invalid.map(([name]) => name);
  };

  const startBidLockIn = () => {
    if (Object.values(currentRound.bids).some(v => v === '')) return;
    const invalidPlayers = validateBidRange(currentRound.bids);
    if (invalidPlayers) {
      playSfx('error');
      triggerHaptic('lock');
      setPopup({ type: 'range-error', message: `Bids must be between 2 and 17. Check: ${invalidPlayers.join(', ')}` });
      return;
    }
    playSfx('click');
    setPopup({ type: 'bid', countdown: 3 });
    setTimerActive(true);
  };

  const startHandLockIn = () => {
    if (Object.values(currentRound.hands).some(v => v === '')) return;
    const invalidPlayers = validateHandRange(currentRound.hands);
    if (invalidPlayers) {
      playSfx('error');
      triggerHaptic('lock');
      setPopup({ type: 'range-error', message: `Hands must be between 0 and 17. Check: ${invalidPlayers.join(', ')}` });
      return;
    }
    if (!validateHands(Object.values(currentRound.hands))) {
      playSfx('error');
      triggerHaptic('lock');
      const total = Object.values(currentRound.hands).reduce((s, v) => s + parseInt(v), 0);
      setPopup({ type: 'range-error', message: `Total hands must equal 17. Currently: ${total}` });
    } else {
      processRound();
    }
  };

  const confirmBids = () => {
    triggerHaptic('lock');
    playSfx('lock');
    setPopup(null);
    setPhase('play');
  };

  const saveEditedRound = (index) => {
    const editedRound = rounds[index];
    const newScores = {
      Ayush: calculateRoundScore(editedRound.bids.Ayush, editedRound.hands.Ayush),
      Harsh: calculateRoundScore(editedRound.bids.Harsh, editedRound.hands.Harsh),
      Mohit: calculateRoundScore(editedRound.bids.Mohit, editedRound.hands.Mohit),
    };
    
    const newRounds = [...rounds];
    newRounds[index] = { ...editedRound, scores: newScores };
    
    // Recalculate absolute totals for players
    const newPlayers = [
      { name: 'Ayush', score: 0 },
      { name: 'Harsh', score: 0 },
      { name: 'Mohit', score: 0 },
    ].map(p => ({
      ...p,
      score: newRounds.reduce((sum, r) => sum + (r.scores[p.name] || 0), 0)
    }));

    setRounds(newRounds);
    setPlayers(newPlayers);
    setEditingRoundIndex(null);
    triggerHaptic('lock');
    playSfx('click');

    updateGame(gameTimestamp.current, {
      timestamp: gameTimestamp.current,
      players: newPlayers.map(p => p.name),
      rounds: newRounds.length,
      totals: newPlayers,
      roundDetails: newRounds,
      status: gameFinished ? 'completed' : 'in-progress',
    });
  };

  const processRound = () => {
    triggerHaptic('round');
    playSfx('click');

    const roundScores = {
      Ayush: calculateRoundScore(currentRound.bids.Ayush, currentRound.hands.Ayush),
      Harsh: calculateRoundScore(currentRound.bids.Harsh, currentRound.hands.Harsh),
      Mohit: calculateRoundScore(currentRound.bids.Mohit, currentRound.hands.Mohit),
    };

    const newPlayers = players.map(p => ({
      ...p,
      score: p.score + roundScores[p.name]
    }));

    const roundDetail = {
      bids: { ...currentRound.bids },
      hands: { ...currentRound.hands },
      scores: roundScores,
    };

    const newRounds = [...rounds, roundDetail];
    setRounds(newRounds);
    setPlayers(newPlayers);
    setDealerIndex((newRounds.length) % 3);
    setCurrentRound({ bids: { Ayush: '', Harsh: '', Mohit: '' }, hands: { Ayush: '', Harsh: '', Mohit: '' } });
    setPhase('bid');
    setPopup(null);

    // Auto-save game to history after every round
    const gameData = {
      timestamp: gameTimestamp.current,
      players: newPlayers.map(p => p.name),
      rounds: newRounds.length,
      totals: newPlayers,
      roundDetails: newRounds,
      status: 'in-progress',
    };

    if (newRounds.length === 1 && !resumeGame) {
      // First round of a new game — create entry
      saveGame(gameData);
    } else {
      // Subsequent rounds or resumed game — update existing
      updateGame(gameTimestamp.current, gameData);
    }

    // Check if anyone just went negative
    const roastMessages = [
      '📉 Down bad!',
      '💀 Finished!',
      '🪦 RIP score!',
      '🤡 Clown move!',
      '😭 Bechara!',
      '🗑️ Absolute scenes!',
    ];
    const justWentNegative = newPlayers.filter((p, idx) => 
      p.score < 0 && players[idx].score >= 0
    );
    if (justWentNegative.length > 0) {
      const victim = justWentNegative[0];
      const msg = roastMessages[Math.floor(Math.random() * roastMessages.length)];
      playSfx('error');
      triggerHaptic('win');
      setNegativeRoast({ name: victim.name, score: victim.score, message: msg });
      setTimeout(() => setNegativeRoast(null), 2500);
    }
  };

  const finishGame = () => {
    triggerHaptic('win');
    playSfx('trophy');

    // Mark game as completed
    updateGame(gameTimestamp.current, {
      timestamp: gameTimestamp.current,
      players: players.map(p => p.name),
      rounds: rounds.length,
      totals: players,
      roundDetails: rounds,
      status: 'completed',
    });
    setGameFinished(true);
  };

  // Winner celebration screen
  if (gameFinished) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 font-outfit relative overflow-hidden">
        {/* Animated celebration bg */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#059669', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7'][i % 5],
              }}
              initial={{ y: '100vh', opacity: 0 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, repeat: Infinity, repeatDelay: Math.random() * 3 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="relative z-10 text-center"
        >
          <div className="text-7xl mb-6">🏆</div>
          <h1 className="text-4xl font-black text-white mb-2">{sorted[0].name} Wins!</h1>
          <p className="text-amber-400 font-bold text-lg mb-12">with {sorted[0].score} points</p>

          <div className="space-y-3 w-full max-w-sm">
            {sorted.map((p, idx) => (
              <motion.div
                key={p.name}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.15 }}
                className={`flex items-center justify-between p-4 rounded-2xl ${idx === 0 ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-dark-800 border border-white/5'}`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-lg font-black ${idx === 0 ? 'text-primary-500' : 'text-slate-600'}`}>#{idx + 1}</span>
                  <span className={`font-bold ${idx === 0 ? 'text-white' : 'text-slate-400'}`}>{p.name}</span>
                </div>
                <span className={`text-xl font-black ${idx === 0 ? 'text-white' : 'text-slate-500'}`}>{p.score}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('home')}
            className="mt-12 bg-primary-500 hover:bg-primary-600 py-4 px-10 rounded-2xl font-black text-white shadow-2xl shadow-primary-500/30"
          >
            BACK HOME
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200 font-outfit pb-40">

      {/* Negative Score Roast Overlay */}
      <AnimatePresence>
        {negativeRoast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setNegativeRoast(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="text-center px-8"
            >
              <div className="text-8xl mb-4">💀</div>
              <h2 className="text-3xl font-black text-rose-400 mb-2">{negativeRoast.name}</h2>
              <p className="text-5xl font-black text-rose-500 mb-4">{negativeRoast.score}</p>
              <p className="text-xl font-bold text-rose-300/80">{negativeRoast.message}</p>
              {/* Falling skulls */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{ left: `${10 + Math.random() * 80}%` }}
                  initial={{ y: '-10vh', opacity: 0 }}
                  animate={{ y: '110vh', opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, repeat: Infinity }}
                >
                  {['💀', '☠️', '🪦', '📉', '🤡'][i % 5]}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <nav className="p-6 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="p-2 -ml-2 text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-4">
          <h2 className="text-xl font-bold text-white">Score Tracker</h2>
          <p className="text-xs text-slate-500 font-medium">{rounds.length} rounds</p>
        </div>
        {rounds.length >= 1 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={finishGame}
            className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 py-2 px-4 rounded-xl text-xs font-bold text-rose-400"
          >
            <Flag className="w-4 h-4" />
            <span>End Game</span>
          </motion.button>
        )}
      </nav>

      {/* Leader Banner */}
      <AnimatePresence>
        {leader && leader.score > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 mb-8"
          >
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-400">{leader.name} leads!</p>
                <p className="text-xs text-amber-400/60 font-medium">with {leader.score} points</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Player Cards */}
      <div className="px-6 mb-12 grid grid-cols-3 gap-4">
        {playersWithDiffs.map((p, idx) => (
          <div
            key={p.name}
            className={`card relative flex flex-col items-start p-5 transition-all ${p.diff === 0 && p.score > 0 ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''}`}
          >
            {p.diff === 0 && p.score > 0 && (
              <div className="absolute top-2 right-2 bg-primary-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow-lg">LEAD</div>
            )}
            {/* Dealer Icon */}
            {idx === dealerIndex && !gameFinished && (
              <div className="absolute top-2 left-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-dark-900 shadow-lg animate-pulse">
                <span className="text-[10px] font-black text-dark-900">D</span>
              </div>
            )}
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${p.name === 'Ayush' ? 'text-amber-500' : p.name === 'Harsh' ? 'text-blue-500' : 'text-orange-500'} ${idx === dealerIndex ? 'pl-4' : ''}`}>
              {p.name}
            </p>
            {rounds.length > 0 && liveNicknames.bidNicks[p.name] && (
              <div className="flex flex-col gap-0.5 mb-2">
                <NicknameBadge nick={liveNicknames.bidNicks[p.name]} />
                <NicknameBadge nick={liveNicknames.skillNicks[p.name]} />
              </div>
            )}
            <div className="flex items-baseline space-x-2">
              <p className="text-4xl font-black text-white">{p.score}</p>
              {p.diff < 0 && (
                <span className="text-[10px] font-bold text-rose-500/80 mb-1">{p.diff}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Score Table Container */}
      <div className="px-6">
        <div className="bg-dark-800/50 border border-white/5 rounded-[32px] overflow-hidden">
          <div className="p-4 grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 border-b border-white/5">
            <span className="text-[10px] font-black text-slate-600 uppercase">#</span>
            {['AYUSH', 'HARSH', 'MOHIT'].map(name => (
              <span key={name} className="text-[10px] font-black text-slate-500 uppercase text-center">{name}</span>
            ))}
            <span className="w-4 h-4" />
          </div>

          <div className="relative">
            {/* Round List */}
            {rounds.length > 0 ? (
              <div className="divide-y divide-white/5">
                {rounds.map((r, i) => (
                  <div key={i} className={`p-4 transition-all ${editingRoundIndex === i ? 'bg-primary-500/10' : 'hover:bg-white/[0.02]'}`}>
                    {editingRoundIndex === i ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-primary-500 uppercase">Editing Round {(i + 1)}</span>
                          <button onClick={() => saveEditedRound(i)} className="bg-primary-500 text-dark-900 text-[10px] font-black px-3 py-1 rounded-full">SAVE</button>
                        </div>
                        <div className="grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 items-center">
                          <span className="w-5" />
                          {['Ayush', 'Harsh', 'Mohit'].map(name => (
                            <div key={name} className="space-y-2">
                              <div className="relative">
                                <div className="w-full bg-dark-900/40 border border-white/5 rounded-lg p-2 text-center text-sm font-bold text-slate-500 opacity-60">
                                  {r.bids[name]}
                                </div>
                                <span className="absolute -top-1.5 left-1 translate-x-1 bg-dark-800 text-[5px] font-black text-slate-600 px-1 rounded uppercase tracking-widest">Call Locked</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  pattern="\d*"
                                  inputMode="numeric"
                                  value={r.hands[name]}
                                  onChange={(e) => {
                                    const newRounds = [...rounds];
                                    newRounds[i].hands[name] = e.target.value;
                                    setRounds(newRounds);
                                  }}
                                  className="w-full bg-dark-900 border border-white/10 rounded-lg p-2 text-center text-sm font-bold text-white outline-none"
                                />
                                <span className="absolute -top-1.5 left-1 translate-x-1 bg-dark-800 text-[5px] font-black text-slate-500 px-1 rounded uppercase">Made</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 items-center">
                        <span className="text-xs font-bold text-slate-600">{(i + 1).toString().padStart(2, '0')}</span>
                        {['Ayush', 'Harsh', 'Mohit'].map(name => (
                          <div key={name} className="text-center">
                            <span className={`text-base font-bold ${r.scores[name] >= 0 ? 'text-slate-400' : 'text-rose-400'}`}>{r.scores[name]}</span>
                            <div className="text-[8px] font-medium text-slate-600 mt-0.5">{r.bids[name]} <ChevronRight className="w-1.5 h-1.5 inline mx-0.5 opacity-30" /> {r.hands[name]}</div>
                          </div>
                        ))}
                        <div className="flex justify-end">
                          <button 
                            onClick={() => {
                              setEditingRoundIndex(i);
                              triggerHaptic('light');
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-700 hover:text-primary-500 transition-colors"
                          >
                             <Lock className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-600 text-sm font-medium italic">
                Rounds will appear here
              </div>
            )}

            {/* Current Active Input Row */}
            {(phase === 'bid' || phase === 'hand') && (
              <div className="p-4 grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 items-center bg-dark-700/50 relative z-10 border-t border-b border-primary-500/20">
                <span className="text-xs font-black text-primary-500">{(rounds.length + 1).toString().padStart(2, '0')}</span>
                {['Ayush', 'Harsh', 'Mohit'].map(name => (
                  <div key={name} className="relative group">
                    <input
                      type="number"
                      pattern="\d*"
                      inputMode="numeric"
                      value={phase === 'bid' ? currentRound.bids[name] : currentRound.hands[name]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (phase === 'bid') {
                          setCurrentRound({ ...currentRound, bids: { ...currentRound.bids, [name]: val } });
                        } else {
                          setCurrentRound({ ...currentRound, hands: { ...currentRound.hands, [name]: val } });
                        }
                      }}
                      className="w-full bg-dark-900/80 border border-white/10 focus:border-primary-500 rounded-xl p-3 text-center text-xl font-bold text-white outline-none transition-all"
                      placeholder="0"
                    />
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-dark-800 text-[6px] font-black text-slate-600 px-1 border border-white/5 rounded uppercase tracking-widest whitespace-nowrap">
                      {phase === 'bid' ? 'Call' : 'Made'}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <div className="w-3 h-3 rounded-full bg-primary-500/20 animate-pulse border border-primary-500/30" />
                </div>
              </div>
            )}

            {/* Locked Bids Row */}
            {phase === 'play' && (
              <div className="p-4 grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 items-center bg-primary-500/5 relative z-10 border-t border-b border-primary-500/20">
                <span className="text-xs font-black text-primary-500">{(rounds.length + 1).toString().padStart(2, '0')}</span>
                {['Ayush', 'Harsh', 'Mohit'].map(name => (
                  <div key={name} className="text-center relative">
                    <span className="text-2xl font-black text-white">{currentRound.bids[name]}</span>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-black text-primary-500 uppercase tracking-widest">LOCKED CALL</div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Lock className="w-4 h-4 text-primary-500/50" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-900 via-dark-900/90 to-transparent z-20">
        <div className="max-w-md mx-auto">
          {phase === 'bid' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={startBidLockIn}
              className="w-full bg-primary-500 hover:bg-primary-600 py-4 rounded-2xl font-black text-white flex items-center justify-center space-x-3 shadow-2xl shadow-primary-500/30"
            >
              <Lock className="w-5 h-5" />
              <span>LOCK BIDS</span>
            </motion.button>
          )}
          {phase === 'play' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('hand')}
              className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-black text-white flex items-center justify-center space-x-3 shadow-2xl shadow-orange-500/30"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>ROUND FINISHED</span>
            </motion.button>
          )}
          {phase === 'hand' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={startHandLockIn}
              className="w-full bg-amber-600 hover:bg-amber-700 py-4 rounded-2xl font-black text-white flex items-center justify-center space-x-3 shadow-2xl shadow-amber-600/30"
            >
              <Save className="w-5 h-5" />
              <span>SAVE ROUND</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-dark-900 rounded-[40px] p-8 max-w-sm w-full text-center relative overflow-hidden"
            >
              {/* Auto-lock progress bar */}
              {popup.countdown !== undefined && (
                <div 
                  className={`absolute top-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${popup.type === 'bid' ? 'bg-primary-500' : 'bg-rose-500'}`}
                  style={{ width: `${(popup.countdown / 3) * 100}%` }}
                />
              )}
              <div className="w-20 h-20 bg-dark-900/5 rounded-full flex items-center justify-center mx-auto mb-6">
                {popup.type === 'range-error' ? <AlertCircle className="w-10 h-10 text-rose-500" /> : popup.type === 'bid' ? <Lock className="w-10 h-10 text-dark-900" /> : <AlertCircle className="w-10 h-10 text-rose-500" />}
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">
                {popup.type === 'range-error' ? 'Invalid Input!' : popup.type === 'bid' ? 'Lock Bids?' : 'Wait!'}
              </h3>
              <p className="text-slate-500 font-medium mb-10 px-4">
                {popup.type === 'range-error' ? popup.message : popup.type === 'bid' ? 'Bids cannot be changed for this round' : 'Total hands made is not 17. Confirm anyway?'}
              </p>

              <div className="flex flex-col space-y-3">
                {popup.type === 'range-error' ? (
                  <button
                    onClick={() => setPopup(null)}
                    className="py-4 bg-dark-900 text-white rounded-2xl font-black text-lg transition-all active:scale-95"
                  >
                    GOT IT
                  </button>
                ) : (
                  <>
                    <button
                      disabled={popup.countdown > 0}
                      onClick={popup.type === 'bid' ? confirmBids : processRound}
                      className="py-4 bg-dark-900 text-white rounded-2xl font-black text-lg disabled:opacity-50 transition-all active:scale-95"
                    >
                      {popup.countdown !== undefined ? (popup.countdown > 0 ? `YES (${popup.countdown})` : 'CONFIRM YES') : 'CONFIRM YES'}
                    </button>
                    <button
                      onClick={() => setPopup(null)}
                      className="py-3 text-slate-400 font-bold hover:text-dark-900 transition-colors"
                    >
                      CANCEL
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameSession;
