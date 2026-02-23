export const calculateRoundScore = (bid, hand) => {
  const b = parseInt(bid);
  const h = parseInt(hand);
  
  if (h >= b) {
    // Win: (Bid * 10) + (Hand - Bid)
    return (b * 10) + (h - b);
  } else {
    // Loss: -(Bid * 10)
    return -(b * 10);
  }
};

export const validateHands = (hands) => {
  const total = hands.reduce((sum, h) => sum + parseInt(h || 0), 0);
  return total === 17;
};

export const getLeaderAndDiffs = (players) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const leaderScore = sorted[0].score;
  
  return players.map(p => ({
    ...p,
    diff: p.score - leaderScore
  }));
};
