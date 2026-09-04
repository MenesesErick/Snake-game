import { COLS, ROWS } from './types';
import type { GameState } from './engine';
import type { Cycle } from './ai';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  cycle: Cycle,
  now: number,
) {
  const W = ctx.canvas.width;
  if (W <= 0) return;
  const cell = W / COLS;
  const auto = g.mode === 'auto';

  /* ---------- tabuleiro claro ---------- */
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#F2FAF3' : '#E1F1E5';
      ctx.fillRect(x * cell, y * cell, cell + 0.6, cell + 0.6);
    }
  }

  /* trilha sutil do ciclo hamiltoniano no modo automático */
  if (auto) {
    ctx.fillStyle = 'rgba(13,74,52,0.10)';
    for (let i = 0; i < cycle.N; i++) {
      const c = cycle.order[i];
      ctx.fillRect(c.x * cell + cell * 0.44, c.y * cell + cell * 0.44, cell * 0.12, cell * 0.12);
    }
  }

  /* ---------- maçã ---------- */
  const fx = (g.food.x + 0.5) * cell;
  const fy = (g.food.y + 0.5) * cell;
  const pulse = 1 + Math.sin(now / 170) * 0.09;
  const r = cell * 0.34 * pulse;

  ctx.fillStyle = 'rgba(11,61,41,0.16)';
  ctx.beginPath();
  ctx.ellipse(fx, fy + r * 0.92, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(fx, fy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,18,60,0.28)';
  ctx.beginPath();
  ctx.arc(fx + r * 0.18, fy + r * 0.22, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(fx - r * 0.08, fy - r * 0.05, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(fx - r * 0.34, fy - r * 0.34, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7C4A21';
  ctx.lineWidth = Math.max(1, cell * 0.07);
  ctx.beginPath();
  ctx.moveTo(fx, fy - r * 0.9);
  ctx.lineTo(fx + r * 0.12, fy - r * 1.25);
  ctx.stroke();

  ctx.fillStyle = '#16A34A';
  ctx.save();
  ctx.translate(fx + r * 0.38, fy - r * 1.12);
  ctx.rotate(-0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.42, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* ---------- cobrinha ---------- */
  const len = g.snake.length;
  const headC = auto ? '#FDE047' : '#4ADE80';
  const midC = auto ? '#F59E0B' : '#22C55E';
  const tailC = auto ? '#B45309' : '#15803D';

  const colorAt = (i: number) => {
    const t = len <= 1 ? 0 : i / (len - 1);
    return t < 0.45 ? mix(headC, midC, t / 0.45) : mix(midC, tailC, (t - 0.45) / 0.55);
  };

  // pontes entre segmentos (corpo contínuo)
  for (let i = len - 2; i >= 0; i--) {
    const a = g.snake[i];
    const b = g.snake[i + 1];
    const x0 = Math.min(a.x, b.x) * cell + cell * 0.19;
    const y0 = Math.min(a.y, b.y) * cell + cell * 0.19;
    const w = (Math.abs(a.x - b.x) + 1) * cell - cell * 0.38;
    const h = (Math.abs(a.y - b.y) + 1) * cell - cell * 0.38;
    ctx.fillStyle = colorAt(i + 1);
    ctx.fillRect(x0, y0, w, h);
  }

  // segmentos
  for (let i = len - 1; i >= 0; i--) {
    const s = g.snake[i];
    const inset = i === 0 ? cell * 0.08 : cell * 0.13;
    ctx.fillStyle = colorAt(i);
    rr(
      ctx,
      s.x * cell + inset,
      s.y * cell + inset,
      cell - inset * 2,
      cell - inset * 2,
      cell * 0.3,
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(9,51,36,0.16)';
    ctx.lineWidth = Math.max(1, cell * 0.04);
    ctx.stroke();
  }

  // cabeça: olhos + língua
  const head = g.snake[0];
  const hx = (head.x + 0.5) * cell;
  const hy = (head.y + 0.5) * cell;
  const d = g.dir;
  const px = -d.y;
  const py = d.x;

  const flick = (now / 1300) % 1 < 0.14 && g.status === 'running';
  if (flick) {
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = Math.max(1.2, cell * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx + d.x * cell * 0.42, hy + d.y * cell * 0.42);
    ctx.lineTo(hx + d.x * cell * 0.78, hy + d.y * cell * 0.78);
    ctx.moveTo(hx + d.x * cell * 0.78, hy + d.y * cell * 0.78);
    ctx.lineTo(
      hx + d.x * cell * 0.95 + px * cell * 0.1,
      hy + d.y * cell * 0.95 + py * cell * 0.1,
    );
    ctx.moveTo(hx + d.x * cell * 0.78, hy + d.y * cell * 0.78);
    ctx.lineTo(
      hx + d.x * cell * 0.95 - px * cell * 0.1,
      hy + d.y * cell * 0.95 - py * cell * 0.1,
    );
    ctx.stroke();
  }

  for (const side of [1, -1]) {
    const ex = hx + d.x * cell * 0.14 + px * cell * 0.19 * side;
    const ey = hy + d.y * cell * 0.14 + py * cell * 0.19 * side;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex, ey, cell * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0B3527';
    ctx.beginPath();
    ctx.arc(ex + d.x * cell * 0.055, ey + d.y * cell * 0.055, cell * 0.078, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------- anel ao comer ---------- */
  const eatT = (now - g.eatAt) / 300;
  if (eatT >= 0 && eatT < 1) {
    ctx.strokeStyle = auto
      ? `rgba(245,158,11,${(1 - eatT) * 0.55})`
      : `rgba(22,163,74,${(1 - eatT) * 0.55})`;
    ctx.lineWidth = Math.max(1.5, cell * 0.14 * (1 - eatT));
    ctx.beginPath();
    ctx.arc(
      (g.eatX + 0.5) * cell,
      (g.eatY + 0.5) * cell,
      cell * (0.45 + eatT * 1.05),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  /* ---------- partículas ---------- */
  for (const p of g.particles) {
    const a = Math.max(0, Math.min(1, p.life / p.max));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    const s = p.size * cell * 0.2;
    ctx.fillRect(p.x * cell - s / 2, p.y * cell - s / 2, s, s);
  }
  ctx.globalAlpha = 1;

  /* ---------- flashes de estado ---------- */
  const dT = now - g.deathAt;
  if (dT < 650) {
    ctx.fillStyle = `rgba(239,68,68,${(1 - dT / 650) * 0.3})`;
    ctx.fillRect(0, 0, W, W);
  }
  const wT = now - g.wonAt;
  if (wT < 1300) {
    ctx.fillStyle = `rgba(251,191,36,${(1 - wT / 1300) * 0.18})`;
    ctx.fillRect(0, 0, W, W);
  }

  /* ---------- vinheta suave ---------- */
  const vg = ctx.createRadialGradient(W / 2, W / 2, W * 0.32, W / 2, W / 2, W * 0.74);
  vg.addColorStop(0, 'rgba(7,35,26,0)');
  vg.addColorStop(1, 'rgba(7,35,26,0.14)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, W);
}
