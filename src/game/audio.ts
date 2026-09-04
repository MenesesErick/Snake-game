let actx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('cobra.muted') === '1';
} catch {
  muted = false;
}

export function isMuted() {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem('cobra.muted', muted ? '1' : '0');
  } catch {
    /* noop */
  }
  return muted;
}

export function ensureAudio() {
  try {
    if (!actx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') void actx.resume();
  } catch {
    /* áudio indisponível — o jogo segue mudo */
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  slideTo?: number,
) {
  if (muted || !actx) return;
  try {
    const t0 = actx.currentTime;
    const o = actx.createOscillator();
    const gain = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gain).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch {
    /* noop */
  }
}

export const sfx = {
  eat() {
    tone(540, 0.09, 'square', 0.045, 810);
  },
  start() {
    tone(392, 0.12, 'square', 0.045, 523);
  },
  click() {
    tone(700, 0.05, 'triangle', 0.04);
  },
  over() {
    tone(320, 0.55, 'sawtooth', 0.055, 55);
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => tone(f, 0.2, 'square', 0.05), i * 110),
    );
  },
};
