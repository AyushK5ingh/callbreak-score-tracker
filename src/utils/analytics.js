const PLAYER_ORDER = ['Ayush', 'Harsh', 'Mohit'];

/**
 * Calculate average bid per player across all games
 * Returns { Ayush: 4.2, Harsh: 6.1, Mohit: 2.8 }
 */
export const getAverageBids = (history) => {
  const totals = { Ayush: { sum: 0, count: 0 }, Harsh: { sum: 0, count: 0 }, Mohit: { sum: 0, count: 0 } };

  history.forEach(game => {
    if (!game.roundDetails) return;
    game.roundDetails.forEach(round => {
      PLAYER_ORDER.forEach(name => {
        const bid = parseInt(round.bids[name] || 0);
        if (bid > 0) {
          totals[name].sum += bid;
          totals[name].count++;
        }
      });
    });
  });

  const averages = {};
  PLAYER_ORDER.forEach(name => {
    averages[name] = totals[name].count > 0 ? (totals[name].sum / totals[name].count).toFixed(1) : '0';
  });
  return averages;
};

/**
 * Calculate average (hand - bid) margin per player
 * Low margin = tight/aggressive play, high margin = safe/overbidding
 */
export const getAverageMargins = (history) => {
  const totals = { Ayush: { sum: 0, count: 0 }, Harsh: { sum: 0, count: 0 }, Mohit: { sum: 0, count: 0 } };

  history.forEach(game => {
    if (!game.roundDetails) return;
    game.roundDetails.forEach(round => {
      PLAYER_ORDER.forEach(name => {
        const bid = parseInt(round.bids[name] || 0);
        const hand = parseInt(round.hands[name] || 0);
        if (bid > 0) {
          totals[name].sum += (hand - bid);
          totals[name].count++;
        }
      });
    });
  });

  const margins = {};
  PLAYER_ORDER.forEach(name => {
    margins[name] = totals[name].count > 0 ? (totals[name].sum / totals[name].count).toFixed(1) : '0';
  });
  return margins;
};

/**
 * BID-BASED Nicknames (based on avg bid level)
 * Avg bid >= 6 → 🍀 Luckboy
 * Avg bid <= 3 → 😢 Bechara
 * In between  → 🤖 NPC Behaviour
 */
export const getBidNicknames = (history) => {
  const avgBids = getAverageBids(history);
  const nicknames = {};

  PLAYER_ORDER.forEach(name => {
    const avg = parseFloat(avgBids[name]);
    if (avg >= 6) {
      nicknames[name] = { label: 'Luckboy', emoji: '🍀', color: 'text-green-400' };
    } else if (avg <= 3 && avg > 0) {
      nicknames[name] = { label: 'Bechara', emoji: '😢', color: 'text-amber-400' };
    } else if (avg > 0) {
      nicknames[name] = { label: 'NPC Behaviour', emoji: '🤖', color: 'text-slate-400' };
    } else {
      nicknames[name] = { label: 'New', emoji: '🆕', color: 'text-slate-600' };
    }
  });

  return nicknames;
};

/**
 * SKILL-BASED Nicknames (based on avg hand-bid margin)
 * Avg (hand - bid) <= 1 → 🔥 Aggressor (plays tight, barely makes bids)
 * Avg (hand - bid) >= 2.5 → 🛡️ Safeboy (overbids, always has cushion)
 * In between → ⚖️ Balanced
 */
export const getSkillNicknames = (history) => {
  const margins = getAverageMargins(history);
  const nicknames = {};

  PLAYER_ORDER.forEach(name => {
    const margin = parseFloat(margins[name]);
    if (margin <= 1 && margins[name] !== '0') {
      nicknames[name] = { label: 'Aggressor', emoji: '🔥', color: 'text-red-400' };
    } else if (margin >= 2.5) {
      nicknames[name] = { label: 'Safeboy', emoji: '🛡️', color: 'text-blue-400' };
    } else if (margins[name] !== '0') {
      nicknames[name] = { label: 'Balanced', emoji: '⚖️', color: 'text-slate-400' };
    } else {
      nicknames[name] = { label: 'New', emoji: '🆕', color: 'text-slate-600' };
    }
  });

  return nicknames;
};

/**
 * Detect comeback and downfall in a single game
 * Comeback King 👑: Was last at any point but finished 1st
 * Downfall 📉: Was 1st at any point but finished last
 */
export const getComebackAndDownfall = (game) => {
  if (!game.roundDetails || game.roundDetails.length < 2) return { comeback: null, downfall: null };

  const cumulativeScores = {};
  PLAYER_ORDER.forEach(name => { cumulativeScores[name] = []; });

  let runningTotals = { Ayush: 0, Harsh: 0, Mohit: 0 };

  game.roundDetails.forEach(round => {
    PLAYER_ORDER.forEach(name => {
      runningTotals[name] += round.scores[name] || 0;
      cumulativeScores[name].push(runningTotals[name]);
    });
  });

  // Track who was first/last at each round
  const wasFirst = { Ayush: false, Harsh: false, Mohit: false };
  const wasLast = { Ayush: false, Harsh: false, Mohit: false };

  const numRounds = game.roundDetails.length;
  for (let i = 0; i < numRounds; i++) {
    const scores = PLAYER_ORDER.map(name => ({ name, score: cumulativeScores[name][i] }));
    scores.sort((a, b) => b.score - a.score);
    wasFirst[scores[0].name] = true;
    wasLast[scores[scores.length - 1].name] = true;
  }

  // Final standings
  const finalScores = PLAYER_ORDER.map(name => ({
    name,
    score: cumulativeScores[name][numRounds - 1]
  }));
  finalScores.sort((a, b) => b.score - a.score);

  const winner = finalScores[0].name;
  const loser = finalScores[finalScores.length - 1].name;

  const comeback = wasLast[winner] ? winner : null;
  const downfall = wasFirst[loser] ? loser : null;

  return { comeback, downfall, cumulativeScores };
};

/**
 * Get lifetime statistics for the Hall of Fame
 */
export const getLifetimeStats = (history) => {
  const significantHistory = history.filter(g => !g.insignificant);
  
  const stats = {
    Ayush: { wins: 0, highRound: 0, comebacks: 0 },
    Harsh: { wins: 0, highRound: 0, comebacks: 0 },
    Mohit: { wins: 0, highRound: 0, comebacks: 0 },
  };

  significantHistory.forEach(game => {
    // Track Wins
    const sorted = [...game.totals].sort((a, b) => b.score - a.score);
    if (sorted.length > 0) {
      stats[sorted[0].name].wins++;
    }

    // Track High Round
    if (game.roundDetails) {
      game.roundDetails.forEach(round => {
        PLAYER_ORDER.forEach(name => {
          stats[name].highRound = Math.max(stats[name].highRound, round.scores[name] || 0);
        });
      });
    }

    // Track Comebacks
    const analysis = getComebackAndDownfall(game);
    if (analysis.comeback) {
      stats[analysis.comeback].comebacks++;
    }
  });

  return stats;
};

export const getTrendData = (game) => {
  if (!game.roundDetails) return null;

  const data = {};
  const runningTotals = { Ayush: 0, Harsh: 0, Mohit: 0 };

  // Start with 0
  PLAYER_ORDER.forEach(name => { data[name] = [0]; });

  game.roundDetails.forEach(round => {
    PLAYER_ORDER.forEach(name => {
      runningTotals[name] += round.scores[name] || 0;
      data[name].push(runningTotals[name]);
    });
  });

  return data;
};
