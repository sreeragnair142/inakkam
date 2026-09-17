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

  // 🫧 Bubble — crisp aquatic droplet
  bubble: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  },

  // 🪕 Cosmic Harp — shimmering ascending arpeggio
  harp: () => {
    playSequence([
      { freq: 523, start: 0, duration: 0.2, type: 'triangle', volume: 0.2 },    // C5
      { freq: 659, start: 0.06, duration: 0.2, type: 'triangle', volume: 0.2 }, // E5
      { freq: 784, start: 0.12, duration: 0.2, type: 'triangle', volume: 0.2 }, // G5
      { freq: 987, start: 0.18, duration: 0.2, type: 'triangle', volume: 0.2 }, // B5
      { freq: 1174, start: 0.24, duration: 0.35, type: 'sine', volume: 0.25 },  // D6
    ]);
  },

  // 💎 Crystal Glass — sparkling high resonance chime
  crystal: () => {
    playSequence([
      { freq: 2093, start: 0, duration: 0.45, type: 'sine', volume: 0.25 },
      { freq: 4186, start: 0, duration: 0.25, type: 'sine', volume: 0.08 },
    ]);
  },

  // 🪄 Magic Wand — twinkling fairy star cluster
  magic: () => {
    playSequence([
      { freq: 1760, start: 0, duration: 0.08, type: 'sine', volume: 0.15 },
      { freq: 2200, start: 0.06, duration: 0.08, type: 'sine', volume: 0.18 },
      { freq: 2640, start: 0.12, duration: 0.1, type: 'sine', volume: 0.2 },
      { freq: 3520, start: 0.18, duration: 0.3, type: 'sine', volume: 0.22 },
    ]);
  },

  // 🎐 Breeze Whistle — airy playful double-tone
  whistle: () => {
    playSequence([
      { freq: 987, start: 0, duration: 0.1, type: 'sine', volume: 0.2 },
      { freq: 1318, start: 0.1, duration: 0.22, type: 'sine', volume: 0.25 },
    ]);
  },

  // 💓 Soft Pulse — modern warm subtle bass thump
  pulse: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  },

  // 🎋 Zen Tone — peaceful calming chime
  flute: () => {
    playSequence([
      { freq: 523, start: 0, duration: 0.3, type: 'sine', volume: 0.25 },
      { freq: 1046, start: 0.05, duration: 0.35, type: 'sine', volume: 0.15 },
    ]);
  },

  // ⚡ Cyber Blip — futuristic digital laser notch
  cyber: () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  },
};

// ─── Public API ──────────────────────────────────────────

/**
 * Play a notification sound by key
 * @param {string} soundKey - Sound preset identifier
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
  { key: 'bubble', label: '🫧 Bubble', description: 'Crisp aquatic drop' },
  { key: 'harp', label: '🪕 Harp', description: 'Shimmering arpeggio' },
  { key: 'crystal', label: '💎 Crystal', description: 'Sparkling high chime' },
  { key: 'magic', label: '🪄 Magic', description: 'Twinkling fairy dust' },
  { key: 'whistle', label: '🎐 Breeze', description: 'Airy double-tone' },
  { key: 'pulse', label: '💓 Pulse', description: 'Warm subtle beat' },
  { key: 'flute', label: '🎋 Zen Tone', description: 'Calming peaceful chime' },
  { key: 'cyber', label: '⚡ Cyber', description: 'Futuristic digital blip' },
];

export default playNotificationSound;
