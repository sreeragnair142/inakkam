// Notification Sound Generator using Web Audio API
// No .mp3 files needed — sounds are generated programmatically

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const playTone = (frequency, duration, type = 'sine', volume = 0.3) => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

const playSequence = (notes, baseDelay = 0) => {
  const ctx = getAudioContext();
  notes.forEach(({ freq, start, duration, type, volume }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume || 0.25, ctx.currentTime + (start || 0));
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (start || 0) + (duration || 0.3));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + (start || 0));
    osc.stop(ctx.currentTime + (start || 0) + (duration || 0.3));
  });
};

// ─── Sound Definitions ──────────────────────────────────

const sounds = {
  // 🔔 Default — classic two-tone ping
  default: () => {
    playSequence([
      { freq: 880, start: 0, duration: 0.15, type: 'sine', volume: 0.3 },
      { freq: 1100, start: 0.15, duration: 0.25, type: 'sine', volume: 0.25 },
    ]);
  },

  // 🎵 Chime — gentle descending chime
  chime: () => {
    playSequence([
      { freq: 1200, start: 0, duration: 0.12, type: 'sine', volume: 0.2 },
      { freq: 900, start: 0.12, duration: 0.12, type: 'sine', volume: 0.2 },
      { freq: 1050, start: 0.24, duration: 0.3, type: 'sine', volume: 0.25 },
    ]);
  },

  // 🛎️ Bell — metallic bell ring
  bell: () => {
    playSequence([
      { freq: 1400, start: 0, duration: 0.08, type: 'square', volume: 0.15 },
      { freq: 1400, start: 0, duration: 0.5, type: 'sine', volume: 0.2 },
      { freq: 2800, start: 0, duration: 0.3, type: 'sine', volume: 0.08 },
    ]);
  },

  // 💫 Pop — bubbly pop sound
  pop: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  // ✨ Ding — short bright ding
  ding: () => {
    playSequence([
      { freq: 1500, start: 0, duration: 0.4, type: 'sine', volume: 0.25 },
      { freq: 3000, start: 0, duration: 0.2, type: 'sine', volume: 0.06 },
    ]);
  },

  // 🎶 Melody — short musical phrase
  melody: () => {
    playSequence([
      { freq: 659, start: 0, duration: 0.12, type: 'sine', volume: 0.2 },    // E5
      { freq: 784, start: 0.13, duration: 0.12, type: 'sine', volume: 0.2 },  // G5
      { freq: 988, start: 0.26, duration: 0.12, type: 'sine', volume: 0.22 }, // B5
      { freq: 1319, start: 0.39, duration: 0.3, type: 'sine', volume: 0.25 }, // E6
    ]);
  },
};

// ─── Public API ──────────────────────────────────────────

/**
 * Play a notification sound by key
 * @param {string} soundKey - One of: 'default', 'chime', 'bell', 'pop', 'ding', 'melody'
 */
export const playNotificationSound = (soundKey = 'default') => {
  const soundFn = sounds[soundKey] || sounds.default;
  try {
    soundFn();
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
};

/**
 * Preview a notification sound (same as play, for settings UI)
 */
export const previewSound = (soundKey) => {
  playNotificationSound(soundKey);
};

/**
 * Get list of available sounds for UI
 */
export const getAvailableSounds = () => [
  { key: 'default', label: '🔔 Default', description: 'Classic two-tone ping' },
  { key: 'chime', label: '🎵 Chime', description: 'Gentle descending chime' },
  { key: 'bell', label: '🛎️ Bell', description: 'Metallic bell ring' },
  { key: 'pop', label: '💫 Pop', description: 'Bubbly pop sound' },
  { key: 'ding', label: '✨ Ding', description: 'Short bright ding' },
  { key: 'melody', label: '🎶 Melody', description: 'Short musical phrase' },
];

export default playNotificationSound;
