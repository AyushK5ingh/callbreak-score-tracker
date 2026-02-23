// Haptic Feedback — uses navigator.vibrate (Android/Capacitor)
export const triggerHaptic = (type = 'light') => {
  if (!navigator.vibrate) return;

  switch (type) {
    case 'lock':
      navigator.vibrate(50);
      break;
    case 'round':
      navigator.vibrate([50, 30, 50]);
      break;
    case 'win':
      navigator.vibrate([50, 30, 50, 30, 100]);
      break;
    default:
      navigator.vibrate(30);
  }
};

// Sound Effects — Web Audio API (no external files needed)
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const playTone = (frequency, duration, type = 'sine', gain = 0.3) => {
  if (!audioCtx) return;
  // Resume context if suspended (autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const vol = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  vol.gain.value = gain;
  vol.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(vol);
  vol.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
};

export const playSound = (type) => {
  switch (type) {
    case 'click':
      // Short, satisfying click
      playTone(800, 0.08, 'square', 0.15);
      setTimeout(() => playTone(1200, 0.05, 'sine', 0.1), 30);
      break;
    case 'lock':
      // Deeper confirmation click
      playTone(600, 0.1, 'triangle', 0.2);
      setTimeout(() => playTone(900, 0.08, 'sine', 0.15), 60);
      break;
    case 'trophy':
      // Celebratory ascending arpeggio
      playTone(523, 0.15, 'sine', 0.2);       // C5
      setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 120);  // E5
      setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 240);  // G5
      setTimeout(() => playTone(1047, 0.3, 'sine', 0.25), 360); // C6
      break;
    case 'error':
      // Low buzzy warning
      playTone(200, 0.2, 'sawtooth', 0.1);
      break;
    default:
      playTone(600, 0.05, 'sine', 0.1);
  }
};
