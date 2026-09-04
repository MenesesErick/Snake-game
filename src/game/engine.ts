import {
  CELLS,
  COLS,
  ROWS,
  type Mode,
  type Particle,
  type Status,
  type Vec,
} from './types';
import { aiNextDir, initialSnake, type Cycle } from './ai';

export interface StepEvents {
  ate: boolean;
  died: boolean;
  won: boolean;
}

export interface GameState {
  snake: Vec[];
  dir: Vec;
  queue: Vec[];
  food: Vec;
  status: Status;
  mode: Mode;
  mult: number;
  score: number;
  eaten: number;
  ticks: number;
  particles: Particle[];
  eatAt: number;
  eatX: number;
  eatY: number;
  deathAt: number;
  wonAt: number;
  newRecord: boolean;
}

export function spawnFood(snake: Vec[]): Vec | null {
  const occ = new Set<number>();
  for (const s of snake) occ.add(s.y * COLS + s.x);
  const free: number[] = [];
  for (let i = 0; i < CELLS; i++) if (!occ.has(i)) free.push(i);
  if (free.length === 0) return null;
  const i = free[(Math.random() * free.length) | 0];
  return { x: i % COLS, y: (i / COLS) | 0 };
}

export function createGame(mode: Mode, mult: number, cycle: Cycle): GameState {
  const { snake, dir } = initialSnake(cycle);
  const food = spawnFood(snake) ?? { x: COLS - 1, y: 0 };
  return {
    snake,
    dir,
    queue: [],
    food,
    status: 'idle',
    mode,
    mult,
    score: 0,
    eaten: 0,
    ticks: 0,
    particles: [],
    eatAt: -1e9,
    eatX: -10,
    eatY: -10,
    deathAt: -1e9,
    wonAt: -1e9,
    newRecord: false,
  };
}

/** Enfileira uma direção (ignora reversão e duplicadas). */
export function queueDirection(g: GameState, d: Vec) {
  const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
  if (d.x === -last.x && d.y === -last.y) return;
  if (d.x === last.x && d.y === last.y) return;
  if (g.queue.length < 3) g.queue.push(d);
}

export function burst(
  g: GameState,
  x: number,
  y: number,
  colors: string[],
  n: number,
  power: number,
) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.6 + Math.random() * 0.8) * power;
    g.particles.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1.4,
      life: 420 + Math.random() * 380,
      max: 800,
      size: 0.5 + Math.random() * 0.9,
      color: colors[(Math.random() * colors.length) | 0],
    });
  }
  if (g.particles.length > 220) g.particles.splice(0, g.particles.length - 220);
}

function celebrate(g: GameState) {
  g.status = 'won';
  g.wonAt = performance.now();
  const colors = ['#FBBF24', '#4ADE80', '#FF6B6B', '#38BDF8', '#F8FAFC'];
  for (let k = 0; k < 9; k++) {
    burst(g, Math.random() * COLS, Math.random() * ROWS, colors, 12, 4.6);
  }
}

export function stepGame(g: GameState, cycle: Cycle): StepEvents {
  const ev: StepEvents = { ate: false, died: false, won: false };

  if (g.mode === 'auto') {
    g.dir = aiNextDir(g.snake, g.food, cycle);
  } else {
    while (g.queue.length) {
      const d = g.queue.shift()!;
      const isReverse = d.x === -g.dir.x && d.y === -g.dir.y;
      const isSame = d.x === g.dir.x && d.y === g.dir.y;
      if (!isReverse && !isSame) {
        g.dir = d;
        break;
      }
    }
  }

  const head = g.snake[0];
  const nx = head.x + g.dir.x;
  const ny = head.y + g.dir.y;

  const die = () => {
    g.status = 'over';
    g.deathAt = performance.now();
    burst(g, head.x, head.y, ['#FF6B6B', '#FBBF24', '#F8FAFC'], 26, 4.4);
    ev.died = true;
  };

  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
    die();
    return ev;
  }

  const willEat = nx === g.food.x && ny === g.food.y;
  const lim = willEat ? g.snake.length : g.snake.length - 1; // cauda sai se não comer
  for (let i = 0; i < lim; i++) {
    const s = g.snake[i];
    if (s.x === nx && s.y === ny) {
      die();
      return ev;
    }
  }

  g.snake.unshift({ x: nx, y: ny });
  g.ticks++;

  if (willEat) {
    g.score += 10 * g.mult;
    g.eaten++;
    g.eatAt = performance.now();
    g.eatX = nx;
    g.eatY = ny;
    burst(g, nx, ny, ['#FF6B6B', '#FBBF24', '#4ADE80'], 14, 3.2);
    ev.ate = true;
    const f = spawnFood(g.snake);
    if (!f) {
      celebrate(g);
      ev.won = true;
      return ev;
    }
    g.food = f;
  } else {
    g.snake.pop();
  }

  if (g.snake.length === CELLS) {
    celebrate(g);
    ev.won = true;
  }

  return ev;
}

export function updateParticles(g: GameState, dtMs: number) {
  if (!g.particles.length) return;
  const dt = dtMs / 1000;
  g.particles = g.particles.filter((p) => {
    p.life -= dtMs;
    if (p.life <= 0) return false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 6.5 * dt;
    p.vx *= 0.985;
    return true;
  });
}
