/* ── Bencho sounds ─────────────────────────────────────────
   24 interface sounds from https://bencho.dev/sounds, synthesised with the
   Web Audio API: no files, no dependencies, a few hundred bytes
   each. Every sound is a list of notes — an oscillator or a burst
   of filtered noise, a lowpass, and an envelope.

     import { play } from "./sounds";
     button.onclick = () => play("tick");

   Browsers only allow audio after a user gesture, so call play()
   from a click, a key press or a pointer event.

   MIT licensed. Beacon and Plop are rebuilt from cuelume by
   Daniel Belyi (MIT, © 2026 Daniel Belyi) — see THIRD_PARTY.md. */

export type Note = {
  hz: number; // pitch, or the filter's corner for noise
  to?: number; // glide to this
  glide?: number; // ms the glide takes, if not the whole note
  ms: number; // length
  gain?: number;
  wave?: OscillatorType;
  cut?: number; // lowpass
  at?: number; // start, ms after play()
  atk?: number; // attack, ms
  noise?: 'bandpass' | 'lowpass';
  q?: number;
  lin?: true; // linear swell instead of exponential
};

export const SOUNDS = {
  paid: [
    { hz: 587, ms: 170, gain: 0.05, wave: 'sine', cut: 2600, atk: 5 },
    { hz: 880, ms: 460, gain: 0.046, wave: 'sine', cut: 2800, atk: 6, at: 95 },
    { hz: 1760, ms: 300, gain: 0.009, wave: 'sine', atk: 8, at: 100 },
  ],
  landed: [
    { hz: 330, to: 620, ms: 120, gain: 0.018, wave: 'triangle', cut: 1400, atk: 30 },
    { hz: 784, ms: 120, gain: 0.04, wave: 'sine', cut: 2600, atk: 4, at: 70 },
    { hz: 1047, ms: 130, gain: 0.04, wave: 'sine', cut: 2800, atk: 4, at: 140 },
    { hz: 1319, ms: 520, gain: 0.044, wave: 'sine', cut: 3000, atk: 5, at: 210 },
    { hz: 2638, ms: 320, gain: 0.007, wave: 'sine', atk: 8, at: 215 },
  ],
  plop: [
    { hz: 480, to: 300, glide: 18, ms: 23, gain: 0.064, atk: 1 },
    { hz: 600, to: 900, glide: 40, ms: 61, gain: 0.015, atk: 12 },
    { hz: 960, to: 600, glide: 18, ms: 18, gain: 0.016, atk: 1 },
  ],
  beacon: [
    { hz: 2500, ms: 5, gain: 0.029, noise: 'lowpass', q: -3, atk: 1 },
    { hz: 880, ms: 602, gain: 0.026, atk: 3 },
    { hz: 2428.8, ms: 283, gain: 0.0077, atk: 3 },
    { hz: 4752, ms: 172, gain: 0.0026, atk: 3 },
    { hz: 882, ms: 573, gain: 0.014, atk: 3 },
    { hz: 1318.51, ms: 562, gain: 0.02, atk: 3 },
    { hz: 3639.1, ms: 264, gain: 0.0059, atk: 3 },
  ],
  drift: [{ hz: 174, to: 155, ms: 250, gain: 0.034, wave: 'sine', cut: 640, atk: 28 }],
  hush: [{ hz: 330, to: 247, ms: 88, gain: 0.03, wave: 'sine', cut: 720, atk: 8 }],
  wisp: [{ hz: 660, to: 720, ms: 38, gain: 0.028, wave: 'sine' }],
  sigh: [{ hz: 262, to: 131, ms: 28, gain: 0.065, wave: 'triangle', cut: 1700, atk: 8 }],
  perk: [{ hz: 330, ms: 360, gain: 0.053, wave: 'sine', cut: 560, atk: 90 }],
  purr: [{ hz: 92, ms: 350, gain: 0.046, wave: 'triangle', cut: 1100, atk: 32 }],
  lull: [{ hz: 234, ms: 214, gain: 0.054, wave: 'sine', cut: 820, atk: 8 }],
  whisk: [{ hz: 124, to: 65, ms: 130, gain: 0.067, wave: 'sine', cut: 560, atk: 50 }],
  buzz: [{ hz: 344, to: 239, ms: 24, gain: 0.048, wave: 'triangle', cut: 1100, atk: 7 }],
  bump: [{ hz: 208, to: 165, ms: 120, gain: 0.03, wave: 'sine', cut: 520, atk: 10 }],
  float: [{ hz: 262, ms: 322, gain: 0.052, wave: 'sine', cut: 820, atk: 16 }],
  glide: [{ hz: 397, to: 276, ms: 205, gain: 0.065, wave: 'sine', cut: 820, atk: 90 }],
  step: [{ hz: 227, to: 114, ms: 311, gain: 0.051, wave: 'sine', cut: 820, atk: 90 }],

  wander: [{ hz: 315, ms: 326, gain: 0.061, wave: 'sine', cut: 820, atk: 7 }],

  tick: [{ hz: 196, to: 130, ms: 150, gain: 0.07, wave: 'sine', cut: 900 }],

  latch: [{ hz: 256, ms: 90, gain: 0.058, wave: 'square', cut: 2400, atk: 10 }],

  hail: [{ hz: 392, ms: 360, gain: 0.051, wave: 'sine', cut: 560, atk: 90 }],

  drape: [{ hz: 220, ms: 215, gain: 0.059, wave: 'sine', cut: 560, atk: 8 }],

  boot: [{ hz: 291, ms: 360, gain: 0.043, wave: 'sine', cut: 560, atk: 90 }],

  drone: [{ hz: 115, ms: 294, gain: 0.068, wave: 'sine', cut: 560, atk: 72 }],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;
export const SOUND_NAMES = Object.keys(SOUNDS) as SoundName[];

const audioContext: { current: AudioContext | undefined } = { current: undefined };
const NOISE = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseFor(c: BaseAudioContext) {
  let b = NOISE.get(c);
  if (!b) {
    b = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate);
    const d = b.getChannelData(0);
    for (let index = 0; index < d.length; index++) {
      d[index] = Math.random() * 2 - 1;
    }
    NOISE.set(c, b);
  }
  return b;
}

/* write a sound's notes into any context, at a time — the same
   code plays it live and can render it into an OfflineAudioContext */
export function schedule(
  c: BaseAudioContext,
  notes: readonly Note[],
  when: number,
  volume = 1,
  bend = 1,
) {
  for (const n of notes) {
    const t0 = when + (n.at ?? 0) / 1000;
    const t1 = t0 + n.ms / 1000;
    const tg = n.glide ? t0 + n.glide / 1000 : t1;
    let source: AudioScheduledSourceNode;
    let head: AudioNode;
    if (n.noise) {
      const s = c.createBufferSource();
      s.buffer = noiseFor(c);
      s.loop = true;
      const f = c.createBiquadFilter();
      f.type = n.noise;
      f.frequency.setValueAtTime(n.hz * bend, t0);
      if (n.to) f.frequency.exponentialRampToValueAtTime(n.to * bend, tg);
      if (n.q !== undefined) f.Q.value = n.q;
      s.connect(f);
      source = s;
      head = f;
    } else {
      const o = c.createOscillator();
      o.type = n.wave ?? 'sine';
      o.frequency.setValueAtTime(n.hz * bend, t0);
      if (n.to) o.frequency.exponentialRampToValueAtTime(n.to * bend, tg);
      source = o;
      head = o;
    }

    const g = c.createGain();
    const atk = Math.min((n.atk ?? 4) / 1000, (n.ms / 1000) * 0.6);
    const peak = (n.gain ?? 0.05) * volume;
    g.gain.setValueAtTime(0.0001, t0);
    if (n.lin) g.gain.linearRampToValueAtTime(peak, t0 + atk);
    else g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t1);
    let tail: AudioNode = head;
    if (n.cut) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = n.cut;
      head.connect(f);
      tail = f;
    }
    tail.connect(g).connect(c.destination);
    if (n.noise) (source as AudioBufferSourceNode).start(t0, Math.random() * 1.5);
    else source.start(t0);
    source.stop(t1 + 0.02);
  }
}

export function play(name: SoundName, o: { volume?: number; pitch?: number } = {}) {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return;
  audioContext.current ??= new AudioContext();
  if (audioContext.current.state === 'suspended') void audioContext.current.resume();
  schedule(
    audioContext.current,
    SOUNDS[name],
    audioContext.current.currentTime + 0.005,
    o.volume ?? 1,
    o.pitch ?? 1,
  );
}
