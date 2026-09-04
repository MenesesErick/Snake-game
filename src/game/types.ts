export type Vec = { x: number; y: number };
export type Status = 'idle' | 'running' | 'paused' | 'over' | 'won';
export type Mode = 'manual' | 'auto';
export type DifficultyKey = 'facil' | 'normal' | 'dificil';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export const COLS = 18;
export const ROWS = 18;
export const CELLS = COLS * ROWS;

export interface DifficultyDef {
  label: string;
  interval: number;
  mult: number;
  blurb: string;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyDef> = {
  facil: { label: 'Fácil', interval: 150, mult: 1, blurb: 'Ritmo tranquilo · pontos ×1' },
  normal: { label: 'Normal', interval: 100, mult: 2, blurb: 'Velocidade clássica · pontos ×2' },
  dificil: { label: 'Difícil', interval: 62, mult: 3, blurb: 'Reflexos em dia · pontos ×3' },
};

export const DIFF_ORDER: DifficultyKey[] = ['facil', 'normal', 'dificil'];
export const AUTO_SPEEDS = [1, 2, 4] as const;
export type AutoSpeed = (typeof AUTO_SPEEDS)[number];
