export type Ambience = {
  resume: () => Promise<void>;
  /** Advances the music; call every frame. */
  update: (dt: number) => void;
  chime: () => void;
  select: () => void;
  setMuted: (muted: boolean) => void;
  close: () => void;
};

/**
 * The studio's sound: a slow, warm gallery score generated in the browser.
 * Soft chords swell and fade through a long reverb while bell notes ring out now and then.
 * No audio files are downloaded.
 */

// A gentle, unresolved progression: Fmaj7 → Am7 → Dm9 → B♭maj7.
const CHORDS: { root: number; notes: number[] }[] = [
  { root: 87.31, notes: [174.61, 220, 261.63, 329.63] },
  { root: 110, notes: [220, 261.63, 329.63, 392] },
  { root: 73.42, notes: [146.83, 174.61, 220, 329.63] },
  { root: 116.54, notes: [233.08, 293.66, 349.23, 440] },
];
// C major pentatonic up high: sits sweetly over every chord above.
const BELLS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

const CHORD_SECONDS = 9;
const VOLUME = 0.6;

export function createAmbience(): Ambience {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = VOLUME;
  master.connect(ctx.destination);

  // A long hall reverb built from decaying noise.
  const reverb = ctx.createConvolver();
  const tail = Math.floor(ctx.sampleRate * 4);
  const impulse = ctx.createBuffer(2, tail, ctx.sampleRate);
  for (let side = 0; side < 2; side += 1) {
    const data = impulse.getChannelData(side);
    for (let i = 0; i < tail; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tail, 3);
  }
  reverb.buffer = impulse;
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  reverb.connect(wet);
  wet.connect(master);

  // Everything musical passes through a soft low-pass, then splits dry and wet.
  const music = ctx.createBiquadFilter();
  music.type = "lowpass";
  music.frequency.value = 2200;
  music.connect(master);
  music.connect(reverb);

  let clock = 0;
  let nextChord = 0.2;
  let chordIndex = 0;
  let nextBell = 3;
  let muted = false;

  const voice = (frequency: number, type: OscillatorType, detune: number, peak: number, start: number, attack: number, hold: number, release: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    const level = ctx.createGain();
    level.gain.setValueAtTime(0.0001, start);
    level.gain.exponentialRampToValueAtTime(peak, start + attack);
    level.gain.setValueAtTime(peak, start + attack + hold);
    level.gain.exponentialRampToValueAtTime(0.0001, start + attack + hold + release);
    osc.connect(level);
    level.connect(music);
    osc.start(start);
    osc.stop(start + attack + hold + release + 0.1);
  };

  const playChord = () => {
    const chord = CHORDS[chordIndex % CHORDS.length];
    chordIndex += 1;
    const now = ctx.currentTime;
    // Each chord fades in over 3s and lingers into the next, so the pad never stops.
    chord.notes.forEach((frequency, i) => {
      const start = now + i * 0.15;
      voice(frequency, "sine", -5, 0.022, start, 3, CHORD_SECONDS - 4, 4.5);
      voice(frequency, "triangle", 6, 0.01, start, 3, CHORD_SECONDS - 4, 4.5);
    });
    voice(chord.root, "sine", 0, 0.035, now, 3.5, CHORD_SECONDS - 4, 5);
  };

  const playBell = () => {
    const frequency = BELLS[Math.floor(Math.random() * BELLS.length)];
    const now = ctx.currentTime;
    // A sine with a quiet inharmonic partial reads as a soft struck bell.
    voice(frequency, "sine", 0, 0.03, now, 0.01, 0, 3.2);
    voice(frequency * 2.76, "sine", 0, 0.006, now, 0.01, 0, 1.4);
  };

  return {
    resume: () => ctx.resume(),
    setMuted(next) {
      muted = next;
      master.gain.setTargetAtTime(next ? 0 : VOLUME, ctx.currentTime, 0.08);
    },
    update(dt) {
      if (muted) return;
      clock += dt;
      if (clock >= nextChord) {
        playChord();
        nextChord = clock + CHORD_SECONDS;
      }
      if (clock >= nextBell) {
        playBell();
        nextBell = clock + 2.5 + Math.random() * 4;
      }
    },
    select() {
      // A soft two-note welcome when the avatar is chosen.
      const now = ctx.currentTime;
      [659.25, 987.77].forEach((frequency, index) => voice(frequency, "sine", 0, 0.08, now + index * 0.09, 0.01, 0, 0.9));
    },
    chime() {
      if (muted) return;
      // Arriving at a painting or a door: a quiet rising triad.
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((frequency, index) => voice(frequency, "sine", 0, 0.035, now + index * 0.07, 0.02, 0, 1.6));
    },
    close() {
      void ctx.close();
    },
  };
}
