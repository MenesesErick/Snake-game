import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CELLS,
  DIFFICULTIES,
  DIFF_ORDER,
  type AutoSpeed,
  type DifficultyKey,
  type Mode,
  type Status,
  type Vec,
} from './game/types';
import { buildCycle } from './game/ai';
import {
  createGame,
  queueDirection,
  stepGame,
  updateParticles,
  type GameState,
} from './game/engine';
import { draw } from './game/render';
import { ensureAudio, isMuted, sfx, toggleMuted } from './game/audio';

/* armazenamento seguro — sandboxes/privacidade podem bloquear localStorage */
const store = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* noop */
    }
  },
};

/* ------------------------------------------------------------------ */
/* ícones                                                              */
/* ------------------------------------------------------------------ */
const ic = 'inline-block shrink-0';

function IconPlay({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`}>
      <path d="M7 4.5v15l13-7.5-13-7.5z" />
    </svg>
  );
}
function IconPause({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`}>
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}
function IconRestart({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={`${ic} ${className}`}>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSound({ on, className = 'w-4 h-4' }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`${ic} ${className}`}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" strokeLinecap="round" />
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" strokeLinecap="round" />
      )}
    </svg>
  );
}
function IconHand({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${ic} ${className}`}>
      <path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5v-1a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13" strokeLinecap="round" />
      <path d="M17 13v-1.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.6a7 7 0 0 1-5.5-2.7L3.6 16a1.8 1.8 0 0 1 2.6-2.5L8 15.5V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCpu({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${ic} ${className}`}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" strokeLinecap="round" />
    </svg>
  );
}
function IconCrown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`}>
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-1.6 11H4.6L3 7zm1.6 13h14.8v2H4.6v-2z" />
    </svg>
  );
}
function IconApple({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${ic} ${className}`}>
      <path d="M12 6.6C10.8 5 8.4 4.6 6.7 5.7 4 7.4 3.5 11.6 5.6 15.3c1.5 2.7 3.6 4.4 5.2 3.6.5-.2.9-.2 1.4 0 1.6.8 3.7-.9 5.2-3.6 2.1-3.7 1.6-7.9-1.1-9.6-1.7-1.1-4.1-.7-5.3.9z" fill="#FF6B6B" />
      <path d="M12 6.5c0-2 1.2-3.4 3-3.9" stroke="#7C4A21" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M13.5 4.8c1.9-.4 3 .3 3.4 1.9-1.9.4-3-.3-3.4-1.9z" fill="#16A34A" />
    </svg>
  );
}
function IconBolt({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}
function IconTrophy({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`}>
      <path d="M6 3h12v2h3v3a5 5 0 0 1-4.6 5A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.6 13 5 5 0 0 1 3 8V5h3V3zm-1 4v1a3 3 0 0 0 1.8 2.7A9.6 9.6 0 0 1 6 7H5zm14 0h-1a9.6 9.6 0 0 1-.8 3.7A3 3 0 0 0 19 8V7z" />
    </svg>
  );
}
function ArrowGlyph({ dir, className = 'w-5 h-5' }: { dir: Vec; className?: string }) {
  const rot = dir.x === 1 ? 90 : dir.x === -1 ? 270 : dir.y === 1 ? 180 : 0;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${ic} ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M12 4l7 8h-4.4v8H9.4v-8H5l7-8z" />
    </svg>
  );
}
function SnakeMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`${ic} ${className}`} fill="none">
      <path d="M4 3h8v5H4v5h8" stroke="#4ADE80" strokeWidth="2.3" strokeLinecap="square" />
      <circle cx="12.6" cy="13" r="1.5" fill="#FBBF24" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* decoração de fundo                                                  */
/* ------------------------------------------------------------------ */
const FIREFLIES = [
  { top: '12%', left: '8%', s: 5, c: '#FBBF24', d: 9, tw: 3.1 },
  { top: '22%', left: '88%', s: 4, c: '#4ADE80', d: 12, tw: 4 },
  { top: '68%', left: '6%', s: 6, c: '#4ADE80', d: 10, tw: 3.6 },
  { top: '82%', left: '90%', s: 5, c: '#FBBF24', d: 13, tw: 2.8 },
  { top: '38%', left: '96%', s: 3, c: '#38BDF8', d: 8, tw: 4.4 },
  { top: '88%', left: '42%', s: 4, c: '#38BDF8', d: 11, tw: 3.3 },
  { top: '8%', left: '55%', s: 3, c: '#4ADE80', d: 9.5, tw: 3.9 },
  { top: '55%', left: '12%', s: 4, c: '#FBBF24', d: 12.5, tw: 2.6 },
];

function Background() {
  return (
    <>
      <div className="scene-bg" aria-hidden />
      <div className="scene-grid" aria-hidden />
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="firefly"
          style={{
            top: f.top,
            left: f.left,
            width: f.s,
            height: f.s,
            background: f.c,
            boxShadow: `0 0 14px 3px ${f.c}55`,
            animationDuration: `${f.d}s, ${f.tw}s`,
          }}
        />
      ))}
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="deco-float pointer-events-none fixed -right-10 top-16 z-0 h-64 w-64 opacity-[0.05]"
        style={{ ['--rot' as string]: '14deg' }}
      >
        <path d="M4 3h8v5H4v5h8" stroke="#4ADE80" strokeWidth="1.4" fill="none" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="deco-float pointer-events-none fixed -left-12 bottom-10 z-0 h-72 w-72 opacity-[0.045]"
        style={{ ['--rot' as string]: '-18deg', animationDuration: '9s' }}
      >
        <path d="M4 3h8v5H4v5h8" stroke="#FBBF24" strokeWidth="1.4" fill="none" />
      </svg>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* pedaços de UI                                                       */
/* ------------------------------------------------------------------ */
function Seg<T extends string | number>({
  options,
  value,
  onSelect,
  render,
}: {
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  render?: (v: T) => React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 rounded-lg border-2 border-[#0A2A1F] bg-[#0A2A1F]/70 p-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={String(o)}
            type="button"
            onClick={() => {
              ensureAudio();
              sfx.click();
              onSelect(o);
            }}
            className={`font-pixel rounded-md px-2 py-2.5 text-[8px] sm:text-[9px] transition-all duration-150 ${
              active
                ? 'bg-[#FBBF24] text-[#3A2A05] shadow-[0_3px_0_#B45309]'
                : 'text-[#8FC7AB] hover:bg-[#134030] hover:text-[#D9F0E4]'
            }`}
          >
            {render ? render(o) : String(o)}
          </button>
        );
      })}
    </div>
  );
}

const STATUS_LED: Record<Status, { label: string; cls: string; pulse: boolean }> = {
  idle: { label: 'PRONTO', cls: 'bg-[#94A3B8]', pulse: false },
  running: { label: 'RODANDO', cls: 'bg-[#4ADE80]', pulse: true },
  paused: { label: 'PAUSADO', cls: 'bg-[#FBBF24]', pulse: false },
  over: { label: 'FIM', cls: 'bg-[#F87171]', pulse: false },
  won: { label: 'VITÓRIA', cls: 'bg-[#A3E635]', pulse: true },
};

function DPad({ onDir, onPause, paused }: { onDir: (d: Vec) => void; onPause: () => void; paused: boolean }) {
  const btn =
    'flex h-14 touch-none select-none items-center justify-center rounded-lg border-2 border-[#0A2A1F] bg-[#164634] text-[#BEE7D2] shadow-[0_4px_0_#0A2A1F] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_#0A2A1F]';
  return (
    <div className="mx-auto mt-4 grid w-full max-w-[250px] grid-cols-3 gap-2 [@media(pointer:fine)]:hidden">
      <span />
      <button type="button" aria-label="Mover para cima" className={btn} onPointerDown={(e) => { e.preventDefault(); onDir({ x: 0, y: -1 }); }}>
        <ArrowGlyph dir={{ x: 0, y: -1 }} />
      </button>
      <span />
      <button type="button" aria-label="Mover para a esquerda" className={btn} onPointerDown={(e) => { e.preventDefault(); onDir({ x: -1, y: 0 }); }}>
        <ArrowGlyph dir={{ x: -1, y: 0 }} />
      </button>
      <button type="button" aria-label={paused ? 'Continuar' : 'Pausar'} className={`${btn} !bg-[#134030] text-[#FBBF24]`} onPointerDown={(e) => { e.preventDefault(); onPause(); }}>
        {paused ? <IconPlay /> : <IconPause />}
      </button>
      <button type="button" aria-label="Mover para a direita" className={btn} onPointerDown={(e) => { e.preventDefault(); onDir({ x: 1, y: 0 }); }}>
        <ArrowGlyph dir={{ x: 1, y: 0 }} />
      </button>
      <span />
      <button type="button" aria-label="Mover para baixo" className={btn} onPointerDown={(e) => { e.preventDefault(); onDir({ x: 0, y: 1 }); }}>
        <ArrowGlyph dir={{ x: 0, y: 1 }} />
      </button>
      <span />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  const cycle = useMemo(() => buildCycle(), []);

  const [status, setStatus] = useState<Status>('idle');
  const [mode, setMode] = useState<Mode>('manual');
  const [diff, setDiff] = useState<DifficultyKey>(() => {
    const saved = store.get('cobra.diff') as DifficultyKey | null;
    return saved && DIFF_ORDER.includes(saved) ? saved : 'normal';
  });
  const [autoSpeed, setAutoSpeed] = useState<AutoSpeed>(() => {
    const n = Number(store.get('cobra.speed'));
    return n === 1 || n === 2 || n === 4 ? (n as AutoSpeed) : 2;
  });
  const [score, setScore] = useState(0);
  const [len, setLen] = useState(3);
  const [ticks, setTicks] = useState(0);
  const [best, setBest] = useState(() => Number(store.get('cobra.best')) || 0);
  const [muted, setMutedState] = useState(isMuted());
  const [newRecord, setNewRecord] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const gameRef = useRef<GameState | null>(null);
  if (gameRef.current === null) {
    gameRef.current = createGame('manual', DIFFICULTIES.normal.mult, cycle);
  }

  const bestRef = useRef(best);
  bestRef.current = best;
  const statusRef = useRef(status);
  statusRef.current = status;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const settingsRef = useRef({ diff, autoSpeed });
  settingsRef.current = { diff, autoSpeed };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const accRef = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  /* ---------------- ações ---------------- */
  const resetGame = (m: Mode, autostart: boolean) => {
    const g = createGame(m, DIFFICULTIES[settingsRef.current.diff].mult, cycle);
    g.status = autostart ? 'running' : 'idle';
    gameRef.current = g;
    accRef.current = 0;
    setScore(0);
    setLen(3);
    setTicks(0);
    setNewRecord(false);
    setStatus(g.status);
  };

  const start = () => {
    const g = gameRef.current!;
    const s = g.status;
    if (s === 'over' || s === 'won') {
      resetGame(g.mode, true);
    } else if (s === 'idle' || s === 'paused') {
      g.status = 'running';
      accRef.current = 0;
      setStatus('running');
    }
    ensureAudio();
    sfx.start();
  };

  const togglePause = () => {
    const g = gameRef.current!;
    if (g.status === 'running') {
      g.status = 'paused';
      setStatus('paused');
      sfx.click();
    } else if (g.status === 'paused') {
      g.status = 'running';
      accRef.current = 0;
      setStatus('running');
      sfx.click();
    }
  };

  const restart = () => {
    ensureAudio();
    sfx.click();
    resetGame(modeRef.current, true);
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    resetGame(m, m === 'auto');
  };

  const selectDiff = (d: DifficultyKey) => {
    setDiff(d);
    store.set('cobra.diff', d);
    gameRef.current!.mult = DIFFICULTIES[d].mult;
  };

  const selectSpeed = (s: AutoSpeed) => {
    setAutoSpeed(s);
    store.set('cobra.speed', String(s));
  };

  const handleDir = (d: Vec) => {
    ensureAudio();
    const g = gameRef.current!;
    if (g.status === 'idle') {
      g.status = 'running';
      setStatus('running');
    }
    if (g.status === 'running' && g.mode === 'manual') queueDirection(g, d);
  };

  const maybeRecord = (g: GameState) => {
    if (g.mode === 'manual' && g.score > bestRef.current) {
      setBest(g.score);
      setNewRecord(true);
      store.set('cobra.best', String(g.score));
    }
  };

  /* ---------------- loop principal ---------------- */
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv ? cv.getContext('2d') : null;
    if (!cv || !ctx) return;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 120);
      last = now;
      const g = gameRef.current!;
      updateParticles(g, dt);

      if (g.status === 'running') {
        const { diff: dk, autoSpeed: aspd } = settingsRef.current;
        const base =
          g.mode === 'auto' ? Math.min(DIFFICULTIES[dk].interval, 95) : DIFFICULTIES[dk].interval;
        const interval = Math.max(14, base / (g.mode === 'auto' ? aspd : 1));
        accRef.current += dt;
        let steps = 0;
        while (accRef.current >= interval && steps < 6 && g.status === 'running') {
          accRef.current -= interval;
          steps++;
          const ev = stepGame(g, cycle);
          if (ev.ate) {
            setScore(g.score);
            setLen(g.snake.length);
            setTicks(g.ticks);
            setPopKey((k) => k + 1);
            sfx.eat();
          }
          if (ev.died) {
            setStatus('over');
            sfx.over();
            maybeRecord(g);
          }
          if (ev.won) {
            setScore(g.score);
            setLen(g.snake.length);
            setTicks(g.ticks);
            setStatus('won');
            sfx.win();
            maybeRecord(g);
          }
        }
        if (accRef.current > interval * 6) accRef.current = 0;
      }

      draw(ctx, g, cycle, now);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  /* ---------------- canvas responsivo ---------------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.round(wrap.clientWidth * dpr);
      if (size > 0) {
        cv.width = size;
        cv.height = size;
      }
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ---------------- teclado ---------------- */
  useEffect(() => {
    const map: Record<string, Vec> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
      W: { x: 0, y: -1 },
      S: { x: 0, y: 1 },
      A: { x: -1, y: 0 },
      D: { x: 1, y: 0 },
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleDir(dir);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const s = statusRef.current;
        if (s === 'running' || s === 'paused') togglePause();
        else start();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        restart();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        setMutedState(toggleMuted());
      }
    };
    window.addEventListener('keydown', onKey);
    const onVis = () => {
      if (document.hidden && statusRef.current === 'running') {
        const g = gameRef.current!;
        g.status = 'paused';
        setStatus('paused');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- toque (deslizar) ---------------- */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = touchRef.current;
    touchRef.current = null;
    if (!st) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      const s = statusRef.current;
      if (s === 'idle' || s === 'over' || s === 'won') start();
      return;
    }
    const dir: Vec =
      Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
    handleDir(dir);
  };

  const led = STATUS_LED[status];
  const progress = Math.round((len / CELLS) * 100);

  /* ------------------------------------------------------------------ */
  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        {/* ---------- cabeçalho ---------- */}
        <header className="flex items-center justify-between gap-3 py-5 sm:py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#2E6B4F] bg-[#0C3325] shadow-[0_6px_0_#0A2A1F]">
              <SnakeMark />
            </div>
            <div>
              <h1 className="font-pixel text-lg leading-tight text-[#F1FAF2] sm:text-2xl" style={{ textShadow: '0 3px 0 #0A2A1F, 0 0 24px rgba(74,222,128,0.35)' }}>
                SNAKE<span className="text-[#FBBF24]">!</span>
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8FC7AB] sm:text-[11px]">
                jogo da cobrinha
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="label-px hidden rounded-md border border-[#2E6B4F] bg-[#0C3325] px-2.5 py-2 sm:block">
              18×18
            </span>
            <button
              type="button"
              onClick={() => {
                ensureAudio();
                setMutedState(toggleMuted());
                sfx.click();
              }}
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
              className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#2E6B4F] bg-[#0C3325] text-[#BEE7D2] shadow-[0_4px_0_#0A2A1F] transition-all hover:text-[#FBBF24] active:translate-y-[2px] active:shadow-[0_2px_0_#0A2A1F]"
            >
              <IconSound on={!muted} />
            </button>
          </div>
        </header>

        {/* ---------- conteúdo ---------- */}
        <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* tabuleiro */}
          <section>
            <div className="board-frame p-2 sm:p-3">
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                </div>
                <span className="font-pixel text-[8px] tracking-[0.22em] text-[#9CCDB4]">
                  COBRA·SYS&nbsp;1.0
                </span>
                <div className="flex items-center gap-2">
                  <span className="label-px !text-[8px]">{led.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${led.cls}`}
                    style={led.pulse ? { animation: 'ledpulse 1.4s ease-out infinite' } : undefined}
                  />
                </div>
              </div>

              <div
                ref={wrapRef}
                className="relative aspect-square touch-none select-none overflow-hidden rounded-b-[10px]"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <div className="scanlines absolute inset-0" aria-hidden />

                {/* overlay: início */}
                {status === 'idle' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(6,26,19,0.72)] p-4">
                    <div className="panel w-full max-w-xs px-6 py-8 text-center" style={{ animation: 'rise 0.3s ease' }}>
                      <div className="mx-auto mb-4 w-fit" style={{ animation: 'wobble 1.6s ease-in-out infinite' }}>
                        <IconApple className="h-12 w-12" />
                      </div>
                      <h2 className="font-pixel text-sm text-[#F1FAF2] sm:text-base">PRONTO PARA JOGAR?</h2>
                      <p className="mt-3 text-sm text-[#9CCDB4]">
                        {mode === 'manual'
                          ? 'Use as setas, WASD ou deslize o dedo para guiar a cobrinha até as maçãs.'
                          : 'A inteligência artificial assume o controle e joga até completar o tabuleiro.'}
                      </p>
                      <button
                        type="button"
                        onClick={start}
                        className="font-pixel mt-6 inline-flex items-center gap-2 rounded-lg border-b-4 border-[#B45309] bg-[#FBBF24] px-6 py-3.5 text-[10px] text-[#3A2A05] transition-all hover:bg-[#FCD34D] active:translate-y-[2px] active:border-b-2"
                      >
                        <IconPlay className="h-3.5 w-3.5" /> COMEÇAR
                      </button>
                      <p className="mt-4 hidden text-xs text-[#6FA88D] [@media(pointer:coarse)]:block">
                        ou toque no tabuleiro
                      </p>
                      <p className="mt-4 hidden items-center justify-center gap-1.5 [@media(pointer:fine)]:flex">
                        <span className="kbd">ESPAÇO</span>
                        <span className="text-xs text-[#6FA88D]">também começa</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* overlay: pausa */}
                {status === 'paused' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(6,26,19,0.72)] p-4">
                    <div className="panel w-full max-w-xs px-6 py-8 text-center" style={{ animation: 'rise 0.25s ease' }}>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FBBF24]/50 bg-[#FBBF24]/10 text-[#FBBF24]">
                        <IconPause className="h-5 w-5" />
                      </div>
                      <h2 className="font-pixel text-sm text-[#FBBF24] sm:text-base">PAUSADO</h2>
                      <p className="mt-3 text-sm text-[#9CCDB4]">A cobrinha está tirando uma soneca.</p>
                      <button
                        type="button"
                        onClick={togglePause}
                        className="font-pixel mt-6 inline-flex items-center gap-2 rounded-lg border-b-4 border-[#B45309] bg-[#FBBF24] px-6 py-3.5 text-[10px] text-[#3A2A05] transition-all hover:bg-[#FCD34D] active:translate-y-[2px] active:border-b-2"
                      >
                        <IconPlay className="h-3.5 w-3.5" /> CONTINUAR
                      </button>
                    </div>
                  </div>
                )}

                {/* overlay: fim de jogo */}
                {status === 'over' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(26,6,8,0.7)] p-4">
                    <div className="panel w-full max-w-xs border-[#7F1D1D] px-6 py-8 text-center" style={{ animation: 'rise 0.3s ease' }}>
                      <h2 className="font-pixel text-base text-[#F87171] sm:text-lg">FIM DE JOGO</h2>
                      <p className="mt-3 text-sm text-[#9CCDB4]">
                        {mode === 'manual' ? 'A cobrinha bateu! Tente de novo.' : 'Imprevisto raríssimo: a IA parou.'}
                      </p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-[#2E6B4F] bg-[#0A2A1F]/70 px-3 py-3">
                          <p className="label-px !text-[7px]">PONTOS</p>
                          <p className="font-pixel mt-1.5 text-sm text-[#FBBF24]">{score}</p>
                        </div>
                        <div className="rounded-lg border border-[#2E6B4F] bg-[#0A2A1F]/70 px-3 py-3">
                          <p className="label-px !text-[7px]">TAMANHO</p>
                          <p className="font-pixel mt-1.5 text-sm text-[#4ADE80]">{len}</p>
                        </div>
                      </div>
                      {newRecord ? (
                        <p className="font-pixel mt-4 animate-pulse text-[9px] text-[#4ADE80]">★ NOVO RECORDE! ★</p>
                      ) : (
                        <p className="mt-4 text-xs text-[#6FA88D]">
                          Recorde: <span className="font-pixel text-[9px] text-[#D9F0E4]">{best}</span>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={start}
                        className="font-pixel mt-5 inline-flex items-center gap-2 rounded-lg border-b-4 border-[#B45309] bg-[#FBBF24] px-6 py-3.5 text-[10px] text-[#3A2A05] transition-all hover:bg-[#FCD34D] active:translate-y-[2px] active:border-b-2"
                      >
                        <IconRestart className="h-3.5 w-3.5" /> JOGAR DE NOVO
                      </button>
                    </div>
                  </div>
                )}

                {/* overlay: vitória */}
                {status === 'won' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(20,16,4,0.72)] p-4">
                    <div className="panel w-full max-w-xs border-[#B45309] px-6 py-8 text-center" style={{ animation: 'rise 0.3s ease' }}>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FBBF24]/60 bg-[#FBBF24]/10 text-[#FBBF24]">
                        <IconTrophy />
                      </div>
                      <h2 className="font-pixel text-base text-[#FBBF24] sm:text-lg">VITÓRIA!</h2>
                      <p className="mt-3 text-sm text-[#9CCDB4]">
                        {mode === 'auto'
                          ? `A IA completou as ${CELLS} células do tabuleiro em ${ticks} passos.`
                          : `Tabuleiro completo: ${CELLS} células! Lenda da cobrinha.`}
                      </p>
                      <p className="font-pixel mt-4 text-lg text-[#FBBF24]">{score} PTS</p>
                      <button
                        type="button"
                        onClick={start}
                        className="font-pixel mt-5 inline-flex items-center gap-2 rounded-lg border-b-4 border-[#B45309] bg-[#FBBF24] px-6 py-3.5 text-[10px] text-[#3A2A05] transition-all hover:bg-[#FCD34D] active:translate-y-[2px] active:border-b-2"
                      >
                        <IconRestart className="h-3.5 w-3.5" /> DE NOVO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DPad onDir={handleDir} onPause={togglePause} paused={status === 'paused'} />

            <p className="mt-3 text-center text-xs text-[#6FA88D] [@media(pointer:fine)]:hidden">
              Deslize no tabuleiro ou use o direcional acima
            </p>
          </section>

          {/* painel lateral */}
          <aside className="grid gap-4">
            {/* placar */}
            <div className="panel p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="label-px">PONTOS</span>
                <span className="font-pixel rounded bg-[#FBBF24]/15 px-2 py-1.5 text-[8px] text-[#FBBF24]">
                  ×{DIFFICULTIES[diff].mult}
                </span>
              </div>
              <div key={popKey} className="mt-2" style={{ animation: 'pop 0.32s ease' }}>
                <span className="font-pixel text-4xl leading-none text-[#FBBF24]" style={{ textShadow: '0 3px 0 rgba(0,0,0,0.35)' }}>
                  {score}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#2E6B4F]/50 pt-3.5">
                <span className="flex items-center gap-2">
                  <IconCrown className="h-4 w-4 text-[#FBBF24]" />
                  <span className="label-px">RECORDE</span>
                </span>
                <span className="flex items-center gap-2">
                  {newRecord && (
                    <span className="font-pixel animate-pulse rounded bg-[#4ADE80] px-1.5 py-1 text-[7px] text-[#06281C]">
                      NOVO!
                    </span>
                  )}
                  <span className="font-pixel text-sm text-[#D9F0E4]">{best}</span>
                </span>
              </div>
              <p className="mt-2.5 text-[11px] leading-snug text-[#6FA88D]">
                O recorde vale para o modo manual — a IA joga só pela glória.
              </p>
            </div>

            {/* dificuldade */}
            <div className="panel p-4 sm:p-5">
              <span className="label-px">DIFICULDADE</span>
              <div className="mt-3">
                <Seg options={DIFF_ORDER} value={diff} onSelect={selectDiff} render={(d) => DIFFICULTIES[d].label} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#9CCDB4]">
                <IconBolt className="h-3.5 w-3.5 text-[#FBBF24]" />
                {DIFFICULTIES[diff].blurb}
              </p>
            </div>

            {/* modo */}
            <div className="panel p-4 sm:p-5">
              <span className="label-px">MODO DE JOGO</span>
              <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-lg border-2 border-[#0A2A1F] bg-[#0A2A1F]/70 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    ensureAudio();
                    sfx.click();
                    selectMode('manual');
                  }}
                  className={`font-pixel flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-[8px] transition-all sm:text-[9px] ${
                    mode === 'manual'
                      ? 'bg-[#4ADE80] text-[#06281C] shadow-[0_3px_0_#15803D]'
                      : 'text-[#8FC7AB] hover:bg-[#134030] hover:text-[#D9F0E4]'
                  }`}
                >
                  <IconHand className="h-3.5 w-3.5" /> MANUAL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ensureAudio();
                    sfx.click();
                    selectMode('auto');
                  }}
                  className={`font-pixel flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-[8px] transition-all sm:text-[9px] ${
                    mode === 'auto'
                      ? 'bg-[#FBBF24] text-[#3A2A05] shadow-[0_3px_0_#B45309]'
                      : 'text-[#8FC7AB] hover:bg-[#134030] hover:text-[#D9F0E4]'
                  }`}
                >
                  <IconCpu className="h-3.5 w-3.5" /> AUTO
                </button>
              </div>

              {mode === 'manual' ? (
                <p className="mt-3 text-xs leading-relaxed text-[#9CCDB4]">
                  Você no controle: coma maçãs, cresça e não bata nas paredes nem no próprio corpo.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-xs leading-relaxed text-[#9CCDB4]">
                    A IA segue um <strong className="text-[#D9F0E4]">ciclo hamiltoniano</strong> com atalhos
                    seguros — ela nunca bate e joga até completar o tabuleiro e vencer.
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="label-px !text-[8px]">VELOCIDADE DA IA</span>
                      <span className="font-pixel text-[8px] text-[#FBBF24]">{autoSpeed}×</span>
                    </div>
                    <div className="mt-2">
                      <Seg options={[1, 2, 4] as readonly AutoSpeed[]} value={autoSpeed} onSelect={selectSpeed} render={(s) => `${s}×`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="label-px !text-[8px]">TABULEIRO</span>
                      <span className="font-pixel text-[8px] text-[#D9F0E4]">
                        {len}/{CELLS}
                      </span>
                    </div>
                    <div className="mt-2 h-3.5 overflow-hidden rounded-full border border-[#2E6B4F] bg-[#0A2A1F]">
                      <div
                        className="bar-stripes h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#4ADE80] transition-all duration-300"
                        style={{ width: `${Math.max(2, progress)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-[#6FA88D]">
                      {status === 'running'
                        ? `A caçada continua — ${progress}% completo…`
                        : status === 'won'
                          ? 'Completo! Vitória da máquina.'
                          : `${progress}% do tabuleiro preenchido.`}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ações */}
            <div className="panel p-4 sm:p-5">
              <span className="label-px">AÇÕES</span>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={status !== 'running' && status !== 'paused'}
                  className="font-pixel flex items-center justify-center gap-2 rounded-lg border-2 border-[#2E6B4F] bg-[#0C3325] px-3 py-3.5 text-[8px] text-[#BEE7D2] shadow-[0_4px_0_#0A2A1F] transition-all hover:text-[#FBBF24] active:translate-y-[2px] active:shadow-[0_2px_0_#0A2A1F] disabled:cursor-not-allowed disabled:opacity-40 sm:text-[9px]"
                >
                  {status === 'paused' ? <IconPlay className="h-3 w-3" /> : <IconPause className="h-3 w-3" />}
                  {status === 'paused' ? 'CONTINUAR' : 'PAUSAR'}
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="font-pixel flex items-center justify-center gap-2 rounded-lg border-b-4 border-[#B45309] bg-[#FBBF24] px-3 py-3.5 text-[8px] text-[#3A2A05] transition-all hover:bg-[#FCD34D] active:translate-y-[2px] active:border-b-2 sm:text-[9px]"
                >
                  <IconRestart className="h-3 w-3" /> REINICIAR
                </button>
              </div>

              <div className="mt-4 hidden flex-col gap-2.5 border-t border-[#2E6B4F]/50 pt-4 [@media(pointer:fine)]:flex">
                <div className="flex items-center justify-between text-xs text-[#9CCDB4]">
                  <span>Mover</span>
                  <span className="flex gap-1">
                    <span className="kbd">↑</span>
                    <span className="kbd">↓</span>
                    <span className="kbd">←</span>
                    <span className="kbd">→</span>
                    <span className="kbd">WASD</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9CCDB4]">
                  <span>Pausar / começar</span>
                  <span className="kbd">ESPAÇO</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9CCDB4]">
                  <span>Reiniciar</span>
                  <span className="kbd">R</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#9CCDB4]">
                  <span>Som liga / desliga</span>
                  <span className="kbd">M</span>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {/* ---------- rodapé ---------- */}
        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[#D9F0E4]/10 pt-5 text-[11px] text-[#6FA88D] sm:flex-row">
          <span>React + Canvas + Tailwind — feito para jogar em qualquer tela.</span>
          <span className="flex items-center gap-1.5">
            <SnakeMark className="h-4 w-4" />
            modo automático guiado por ciclo hamiltoniano
          </span>
        </footer>
      </div>
    </div>
  );
}
