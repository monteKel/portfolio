// Demonstração de brinquedo do problema da diversidade máxima (MDP):
// escolher m de n pontos maximizando a soma das distâncias entre os escolhidos.
// Busca local por trocas (best improvement) + uma perturbação. Tudo determinístico.

export const COLS = 56;
export const ROWS = 18;
const CELL_ASPECT = 1.9; // uma célula de texto é ~1.9x mais alta que larga

export type Kind = 'start' | 'swap' | 'perturb' | 'optimum';
export interface MdpState {
  sel: number[];
  f: number;
  kind: Kind;
  out?: number;
  in?: number;
  delta?: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTrace(seed = 2027, n = 40, m = 8) {
  const rand = mulberry32(seed);
  const pts: [number, number][] = [];
  const used = new Set<string>();
  while (pts.length < n) {
    const x = 1 + Math.floor(rand() * (COLS - 2));
    const y = 1 + Math.floor(rand() * (ROWS - 2));
    // espaço mínimo para não grudar pontos
    let ok = true;
    for (const [px, py] of pts) if (Math.abs(px - x) < 3 && Math.abs(py - y) < 2) ok = false;
    const key = `${x},${y}`;
    if (!ok || used.has(key)) continue;
    used.add(key);
    pts.push([x, y]);
  }

  const D = pts.map(([ax, ay]) =>
    pts.map(([bx, by]) => Math.hypot((ax - bx) / COLS, ((ay - by) * CELL_ASPECT) / COLS)),
  );
  const total = (sel: number[]) => {
    let s = 0;
    for (let i = 0; i < sel.length; i++) for (let j = i + 1; j < sel.length; j++) s += D[sel[i]!]![sel[j]!]!;
    return s;
  };

  const states: MdpState[] = [];
  let sel: number[] = [];
  while (sel.length < m) {
    const c = Math.floor(rand() * n);
    if (!sel.includes(c)) sel.push(c);
  }
  states.push({ sel: [...sel], f: total(sel), kind: 'start' });

  const localSearch = () => {
    for (;;) {
      let best = 1e-9;
      let bi = -1;
      let bj = -1;
      for (let a = 0; a < sel.length; a++) {
        const i = sel[a]!;
        for (let j = 0; j < n; j++) {
          if (sel.includes(j)) continue;
          let d = 0;
          for (const k of sel) if (k !== i) d += D[j]![k]! - D[i]![k]!;
          if (d > best) {
            best = d;
            bi = a;
            bj = j;
          }
        }
      }
      if (bi < 0) return;
      const out = sel[bi]!;
      sel[bi] = bj;
      states.push({ sel: [...sel], f: total(sel), kind: 'swap', out, in: bj, delta: best });
    }
  };

  localSearch();
  let bestSel = [...sel];
  let bestF = total(sel);

  // perturbação: 2 trocas aleatórias, depois busca local de novo
  for (let s = 0; s < 2; s++) {
    const a = Math.floor(rand() * m);
    let j = Math.floor(rand() * n);
    while (sel.includes(j)) j = Math.floor(rand() * n);
    sel[a] = j;
  }
  states.push({ sel: [...sel], f: total(sel), kind: 'perturb' });
  localSearch();
  if (total(sel) < bestF) sel = bestSel;
  else bestSel = [...sel];
  bestF = total(sel);
  states.push({ sel: [...bestSel], f: bestF, kind: 'optimum' });

  return { pts, states };
}

// ---------- desenho em camadas de texto (cada camada tem uma cor no CSS) ----------
function blank(): string[][] {
  return Array.from({ length: ROWS }, () => Array<string>(COLS).fill(' '));
}

function line(buf: string[][], x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    if (buf[y]?.[x] === ' ') buf[y]![x] = '.';
    if (x === x1 && y === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** camadas da grade, da mais fraca para a mais forte (a última fica por cima) */
export type Grids = { edges: string[][]; pts: string[][]; sel: string[][]; out: string[][]; in: string[][] };

export function buildGrids(pts: [number, number][], st: MdpState): Grids {
  const edges = blank();
  const points = blank();
  const chosen = blank();
  const swapIn = blank();
  const swapOut = blank();
  const selSet = new Set(st.sel);

  for (let a = 0; a < st.sel.length; a++)
    for (let b = a + 1; b < st.sel.length; b++) {
      const [x0, y0] = pts[st.sel[a]!]!;
      const [x1, y1] = pts[st.sel[b]!]!;
      line(edges, x0, y0, x1, y1);
    }
  pts.forEach(([x, y], i) => {
    if (i === st.in) swapIn[y]![x] = '@';
    else if (i === st.out) swapOut[y]![x] = 'x';
    else if (selSet.has(i)) chosen[y]![x] = '@';
    else points[y]![x] = 'o';
    // remove a aresta que passa por baixo de um ponto
    edges[y]![x] = ' ';
  });
  return { edges, pts: points, sel: chosen, out: swapOut, in: swapIn };
}

/**
 * Desenha a grade num canvas (texto miúdo de enfeite não vira texto da página: o painel
 * tem role="img" + descrição). Cores e pesos por camada, na ordem de Grids.
 */
export function paintGrids(canvas: HTMLCanvasElement, g: Grids, style: Record<keyof Grids, [string, number]>) {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (!cssW || !cssH) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const cw = cssW / COLS;
  const lh = cssH / ROWS;
  const fs = cw / 0.75; // Martian Mono: avanço de 0.75em
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (const key of ['edges', 'pts', 'sel', 'out', 'in'] as const) {
    const [color, weight] = style[key];
    ctx.fillStyle = color;
    ctx.font = `${weight} ${fs}px "Martian Mono Variable", ui-monospace, monospace`;
    g[key].forEach((row, r) =>
      row.forEach((ch, c) => {
        if (ch !== ' ') ctx.fillText(ch, (c + 0.5) * cw, (r + 0.5) * lh);
      }),
    );
  }
}
