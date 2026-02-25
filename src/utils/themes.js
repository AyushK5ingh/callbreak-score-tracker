export const THEMES = {
  default: {
    id: 'default',
    name: 'Emerald Aurora',
    emoji: '✨',
    colors: {
      primary: '#D4A017',
      primaryDark: '#B8860B',
      accent: '#059669',
      bg: '#0c0c0c',
      card: '#161616',
    },
    audio: {
      oscillator: 'sine',
      gain: 0.3
    }
  },
  casino: {
    id: 'casino',
    name: 'Casino Night',
    emoji: '🎲',
    colors: {
      primary: '#FFD700',
      primaryDark: '#B8860B',
      accent: '#DC2626',
      bg: '#064E3B', // Deep forest green (felt)
      card: '#065F46',
    },
    audio: {
      oscillator: 'triangle',
      gain: 0.4
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '⚡',
    colors: {
      primary: '#CF06F0', // Neon Pink
      primaryDark: '#7C3AED', // Purple
      accent: '#06B6D4', // Cyan
      bg: '#030014', // Virtual black
      card: '#0B0121',
    },
    audio: {
      oscillator: 'square',
      gain: 0.2
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic Deck',
    emoji: '🃏',
    colors: {
      primary: '#92400E', // Leather brown
      primaryDark: '#78350F',
      accent: '#166534', // Paper green
      bg: '#F5F5DC', // Beige/Paper
      card: '#E5E7EB', // Light gray
    },
    audio: {
      oscillator: 'sine',
      gain: 0.3
    },
    isLight: true
  }
};

export const getTheme = (id) => THEMES[id] || THEMES.default;
