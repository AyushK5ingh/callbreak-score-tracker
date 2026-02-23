const STORAGE_KEY = 'callbreak_history';

export const getHistory = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGame = (game) => {
  const history = getHistory();
  const newHistory = [game, ...history];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

export const getPlayerStats = () => {
  const history = getHistory();
  const players = ['Ayush', 'Mohit', 'Harsh'];
  const stats = {
    Ayush: { '1st': 0, '2nd': 0, '3rd': 0 },
    Mohit: { '1st': 0, '2nd': 0, '3rd': 0 },
    Harsh: { '1st': 0, '2nd': 0, '3rd': 0 },
  };

  history.forEach(game => {
    const sorted = [...game.totals].sort((a, b) => b.score - a.score);
    sorted.forEach((p, index) => {
      const pos = index === 0 ? '1st' : index === 1 ? '2nd' : '3rd';
      if (stats[p.name]) {
        stats[p.name][pos]++;
      }
    });
  });

  return stats;
};
