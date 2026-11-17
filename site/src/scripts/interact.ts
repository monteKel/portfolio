// Interações de mouse na página inteira:
// - o cursor é uma massa: lente gravitacional + poeira no fundo (no motor do buraco negro)
// - clique num espaço vazio solta uma onda de radiação dali
// - rastro ASCII por cima de tudo
// - borda dos painéis/cards acende onde o mouse está; cards inclinam de leve
// Só com mouse de verdade (nada disso em toque) e nunca com "reduzir movimento".
import type { BlackHole } from './blackhole/host';

const TRAIL_CHARS = ['.', ':', '+', '*', 'x', '%'];
const TRAIL_COLORS = ['#ffdb80', '#ffa63d', '#ff7b1c'];
const INTERACTIVE = 'a, button, input, textarea, select, label, .mc, .term, .email';

export function initInteractions(getBh: () => BlackHole | null): void {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  // ---------- lente + poeira no fundo ----------
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      getBh()?.mouse(e.clientX, e.clientY);
      addTrail(e.clientX, e.clientY);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => getBh()?.mouse(null));
  window.addEventListener('blur', () => getBh()?.mouse(null));

  // ---------- clique no vazio: onda ----------
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (el.closest(INTERACTIVE)) return;
    getBh()?.pulseAtScreen(e.clientX, e.clientY, 0.9);
    burst(e.clientX, e.clientY);
  });

  // ---------- rastro ASCII (canvas por cima, sem bloquear cliques) ----------
  const canvas = document.querySelector<HTMLCanvasElement>('.trail');
  const ctx = canvas?.getContext('2d') ?? null;
  type Dot = { x: number; y: number; born: number; ch: string; color: string; vx: number; vy: number };
  const dots: Dot[] = [];
  let lastX = -1e9;
  let lastY = -1e9;
  let raf = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    if (!canvas) return;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;

  function addTrail(x: number, y: number) {
    if (!ctx) return;
    if (Math.hypot(x - lastX, y - lastY) < 14) return;
    lastX = x;
    lastY = y;
    dots.push({ x, y, born: performance.now(), ch: pick(TRAIL_CHARS), color: pick(TRAIL_COLORS), vx: 0, vy: 0 });
    if (dots.length > 22) dots.shift();
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function burst(x: number, y: number) {
    if (!ctx) return;
    const now = performance.now();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      dots.push({ x, y, born: now, ch: pick(TRAIL_CHARS), color: pick(TRAIL_COLORS), vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 1.2 });
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function draw() {
    if (!ctx || !canvas) return;
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${12 * dpr}px "Martian Mono Variable", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i]!;
      const age = (now - d.born) / 520;
      if (age >= 1) {
        dots.splice(i, 1);
        continue;
      }
      d.x += d.vx;
      d.y += d.vy;
      ctx.globalAlpha = (1 - age) * 0.85;
      ctx.fillStyle = d.color;
      ctx.fillText(d.ch, d.x * dpr, (d.y - age * 10) * dpr);
    }
    ctx.globalAlpha = 1;
    raf = dots.length ? requestAnimationFrame(draw) : 0;
  }

  // ---------- borda que acende sob o mouse + inclinação dos cards ----------
  document.querySelectorAll<HTMLElement>('.pane, .card').forEach((el) => {
    const isCard = el.classList.contains('card');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      el.style.setProperty('--mx', `${px}px`);
      el.style.setProperty('--my', `${py}px`);
      if (isCard) {
        const rx = (py / r.height - 0.5) * -5;
        const ry = (px / r.width - 0.5) * 6;
        el.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
      }
    });
    el.addEventListener('pointerleave', () => {
      if (isCard) el.style.transform = '';
    });
  });
}
