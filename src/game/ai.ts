import { COLS, ROWS, type Vec } from './types';

export interface Cycle {
  order: Vec[];
  index: Int32Array;
  N: number;
}

/**
 * Constrói um ciclo hamiltoniano em formato de serpentina no grid
 * (exige número par de colunas — COLS = 18).
 * Percurso: desce a coluna 0, serpenteia pelas colunas 1..COLS-1
 * e retorna pela linha 0 até fechar o ciclo.
 */
export function buildCycle(cols: number = COLS, rows: number = ROWS): Cycle {
  const order: Vec[] = [];
  for (let y = 0; y < rows; y++) order.push({ x: 0, y });
  for (let x = 1; x < cols; x++) {
    if (x % 2 === 1) {
      for (let y = rows - 1; y >= 1; y--) order.push({ x, y });
    } else {
      for (let y = 1; y < rows; y++) order.push({ x, y });
    }
  }
  for (let x = cols - 1; x >= 1; x--) order.push({ x, y: 0 });

  const index = new Int32Array(cols * rows);
  order.forEach((c, i) => {
    index[c.y * cols + c.x] = i;
  });
  return { order, index, N: cols * rows };
}

/** Cobra inicial alinhada ao ciclo (índices 6, 5, 4). */
export function initialSnake(cycle: Cycle): { snake: Vec[]; dir: Vec } {
  const head = cycle.order[6];
  const b1 = cycle.order[5];
  const b2 = cycle.order[4];
  return {
    snake: [{ ...head }, { ...b1 }, { ...b2 }],
    dir: { x: head.x - b1.x, y: head.y - b1.y },
  };
}

const DIRS: Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/**
 * Decide o próximo movimento da IA.
 * Regra de segurança: só entra numa célula cujo índice no ciclo esteja
 * no arco livre entre a cabeça e a cauda — assim nunca "ultrapassa" o
 * próprio corpo. Atalhos gananciosos aproximam a cabeça da comida mais
 * rápido; quando a cobra já está grande, segue o ciclo puro até vencer.
 */
export function aiNextDir(snake: Vec[], food: Vec, cycle: Cycle): Vec {
  const { index, order, N } = cycle;
  const head = snake[0];
  const tail = snake[snake.length - 1];
  const h = index[head.y * COLS + head.x];
  const t = index[tail.y * COLS + tail.x];
  const f = index[food.y * COLS + food.x];
  const relT = (t - h + N) % N;

  const cycleNext = order[(h + 1) % N];
  const fallback: Vec = { x: cycleNext.x - head.x, y: cycleNext.y - head.y };

  // Cobra grande: seguir o ciclo garante a vitória sem riscos.
  if (snake.length > N * 0.5) return fallback;

  const occupied = new Set<number>();
  for (const s of snake) occupied.add(s.y * COLS + s.x);

  let best: Vec | null = null;
  let bestDist = Infinity;

  for (const d of DIRS) {
    const cx = head.x + d.x;
    const cy = head.y + d.y;
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) continue;

    const ci = index[cy * COLS + cx];
    const relC = (ci - h + N) % N;
    if (relC === 0) continue;

    const willEat = cx === food.x && cy === food.y;
    const isTail = cx === tail.x && cy === tail.y;
    const key = cy * COLS + cx;

    // Célula ocupada só é aceita se for a cauda que vai sair (e sem comer).
    if (occupied.has(key) && !(isTail && !willEat)) continue;

    // Segurança no ciclo: não ultrapassar a cauda.
    const safe = relC < relT || (relC === relT && isTail && !willEat);
    if (!safe) continue;

    const dist = (f - ci + N) % N;
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }

  return best ?? fallback;
}
