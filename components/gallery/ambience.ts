export type Ambience = {
  resume: () => Promise<void>;
  update: (dt: number, moving: boolean, pace: number) => void;
  chime: () => void;
  select: () => void;
  setMuted: (muted: boolean) => void;
  close: () => void;
};

export function createAmbience(): Ambience {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const melody = [220, 261.63, 329.63, 392, 329.63, 293.66, 246.94, 196];
  let step = 0;
  let clock = 0;
  let nextNote = 0.35;
  let note = 0;
  let muted = false;

  const playNote = (frequency: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1600;
    const level = ctx.createGain();
    level.gain.setValueAtTime(0.0001, now);
    level.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
    level.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    osc.connect(filter);
    filter.connect(level);
    level.connect(master);
    osc.start(now);
    osc.stop(now + 1.4);
  };

  const footstep = () => {
    const src = ctx.createBufferSource();
    const length = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const env = 1 - i / length;
      channel[i] = (Math.random() * 2 - 1) * env * env;
    }
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 160 + Math.random() * 90;
    band.Q.value = 0.8;
    const level = ctx.createGain();
    level.gain.value = 0.7;
    src.connect(band);
    band.connect(level);
    level.connect(master);
    src.start();
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.value = 78 + Math.random() * 24;
    const body = ctx.createGain();
    const now = ctx.currentTime;
    body.gain.setValueAtTime(0.28, now);
    body.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    thump.connect(body);
    body.connect(master);
    thump.start(now);
    thump.stop(now + 0.11);
  };

  return {
    resume: () => ctx.resume(),
    setMuted(next) {
      muted = next;
      master.gain.setTargetAtTime(next ? 0 : 0.55, ctx.currentTime, 0.06);
    },
    update(dt, moving, pace) {
      if (muted) {
        step = 0;
        return;
      }
      clock += dt;
      let guard = 0;
      while (clock >= nextNote && guard < 3) {
        playNote(melody[note % melody.length]);
        note += 1;
        nextNote += 0.72;
        guard += 1;
      }
      if (!moving) {
        step = 0;
        return;
      }
      step += dt;
      const interval = pace > 1.2 ? 0.28 : 0.42;
      if (step < interval) return;
      step = 0;
      footstep();
    },
    select() {
      const now = ctx.currentTime;
      const length = Math.floor(ctx.sampleRate * 0.025);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = "highpass";
      clickFilter.frequency.value = 1400;
      const clickLevel = ctx.createGain();
      clickLevel.gain.value = 0.4;
      noise.connect(clickFilter);
      clickFilter.connect(clickLevel);
      clickLevel.connect(master);
      noise.start(now);
      [659.25, 987.77].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        const level = ctx.createGain();
        const start = now + index * 0.055;
        level.gain.setValueAtTime(0.0001, start);
        level.gain.exponentialRampToValueAtTime(0.16, start + 0.012);
        level.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
        osc.connect(level);
        level.connect(master);
        osc.start(start);
        osc.stop(start + 0.12);
      });
    },
    chime() {
      if (muted) return;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        const level = ctx.createGain();
        const start = ctx.currentTime + index * 0.06;
        level.gain.setValueAtTime(0.0001, start);
        level.gain.exponentialRampToValueAtTime(0.05, start + 0.03);
        level.gain.exponentialRampToValueAtTime(0.0001, start + 1.15);
        osc.connect(level);
        level.connect(master);
        osc.start(start);
        osc.stop(start + 1.2);
      });
    },
    close() {
      void ctx.close();
    },
  };
}
