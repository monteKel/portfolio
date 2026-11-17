// K-means jogável: você posiciona os centróides; o algoritmo (Lloyd) pode rodar a partir
// da sua posição. Início ruim = mínimo local. Meta: igualar a melhor inércia conhecida
// (melhor de 40 execuções com inicialização k-means++, calculada ao carregar o nível).
import { blank, join, layer, mulberry32, shell, type Lang } from './kit';

const W = 56;
const H = 16;
const ASPECT = 1.9; // célula ~1.9x mais alta que larga: distância "visual"
const GLYPH = ['o', 'x', '+', '*', '#'];
const NAMES = ['A', 'B', 'C', 'D', 'E'];

interface Level {
  k: number;
  seed: number;
  blobs: number;
  spread: number;
  sizes: number[];
}
const LEVELS: Level[] = [
  { k: 3, seed: 11, blobs: 3, spread: 2.2, sizes: [14, 14, 14] },
  { k: 4, seed: 23, blobs: 4, spread: 3.2, sizes: [12, 12, 12, 12] },
  { k: 5, seed: 37, blobs: 5, spread: 3.4, sizes: [16, 6, 12, 8, 10] },
];

type P = [number, number];

const T = {
  en: {
    title: 'k-means',
    help: 'Group the points into k clusters. Pick a centroid (A-E buttons or keys 1-5), then click the board or use the arrow keys to move it. Each point joins its nearest centroid. Lower inertia is better. step runs one k-means iteration, run goes until it stops moving.',
    level: (n: number, t: number, k: number) => `level ${n}/${t}. k = ${k}.`,
    score: (v: number, best: number) => `inertia ${v.toFixed(1)}. best known: ${best.toFixed(1)}.`,
    selected: (c: string) => `moving ${c}.`,
    winSelf: 'best known inertia, placed by you.',
    runBest: (it: number) => `your starting centroids led k-means to the best known inertia in ${it} iterations. the start is everything.`,
    runLocal: (it: number, v: number, b: number) =>
      `k-means converged in ${it} iterations to ${v.toFixed(1)}: a local minimum (best is ${b.toFixed(1)}). move a centroid and run again.`,
    allDone: 'that was the last level.',
    step: 'step',
    run: 'run',
    next: 'next level',
    quit: 'quit',
  },
  pt: {
    title: 'k-means',
    help: 'Agrupe os pontos em k grupos. Escolha um centróide (botões A-E ou teclas 1-5) e clique no tabuleiro ou use as setas para movê-lo. Cada ponto entra no centróide mais próximo. Inércia menor é melhor. passo roda uma iteração do k-means, rodar vai até parar de mexer.',
    level: (n: number, t: number, k: number) => `nível ${n}/${t}. k = ${k}.`,
    score: (v: number, best: number) => `inércia ${v.toFixed(1)}. melhor conhecida: ${best.toFixed(1)}.`,
    selected: (c: string) => `movendo ${c}.`,
    winSelf: 'melhor inércia conhecida, posicionada por você.',
    runBest: (it: number) => `seus centróides iniciais levaram o k-means à melhor inércia conhecida em ${it} iterações. o início é tudo.`,
    runLocal: (it: number, v: number, b: number) =>
      `o k-means convergiu em ${it} iterações para ${v.toFixed(1)}: um mínimo local (a melhor é ${b.toFixed(1)}). mova um centróide e rode de novo.`,
    allDone: 'esse era o último nível.',
    step: 'passo',
    run: 'rodar',
    next: 'próximo nível',
    quit: 'sair',
  },
  ja: {
    title: 'k-means',
    help: '点を k 個のクラスタに分けてください。重心を選び（A-E ボタンまたは 1-5 キー）、盤面をクリックするか矢印キーで動かします。各点はいちばん近い重心に属します。慣性（inertia）は小さいほど良い結果です。「ステップ」で k-means を1回反復、「実行」で動かなくなるまで続けます。',
    level: (n: number, t: number, k: number) => `レベル ${n}/${t}。k = ${k}。`,
    score: (v: number, best: number) => `慣性 ${v.toFixed(1)}。既知の最良値: ${best.toFixed(1)}。`,
    selected: (c: string) => `${c} を移動中。`,
    winSelf: 'あなたの配置で、既知の最良の慣性に到達しました。',
    runBest: (it: number) => `あなたの初期重心から、k-means は ${it} 回の反復で既知の最良値に到達しました。初期値がすべてを決めます。`,
    runLocal: (it: number, v: number, b: number) =>
      `k-means は ${it} 回の反復で ${v.toFixed(1)} に収束しました。局所最小値です（最良は ${b.toFixed(1)}）。重心を動かして、もう一度実行してください。`,
    allDone: 'これが最後のレベルでした。',
    step: 'ステップ',
    run: '実行',
    next: '次のレベル',
    quit: '終了',
  },
};

function makeData(L: Level): P[] {
  const rand = mulberry32(L.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const pts: P[] = [];
  const used = new Set<string>();
  for (let b = 0; b < L.blobs; b++) {
    const cx = 6 + rand() * (W - 12);
    const cy = 2 + rand() * (H - 4);
    let placed = 0;
    let guard = 0;
    while (placed < L.sizes[b]! && guard++ < 500) {
      const x = Math.round(cx + gauss() * L.spread * 1.9);
      const y = Math.round(cy + gauss() * L.spread * 0.55);
      const key = `${x},${y}`;
      if (x < 1 || x > W - 2 || y < 0 || y > H - 1 || used.has(key)) continue;
      used.add(key);
      pts.push([x, y]);
      placed++;
    }
  }
  return pts;
}

const d2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + ((a[1] - b[1]) * ASPECT) ** 2;

function assign(pts: P[], cs: P[]): number[] {
  return pts.map((p) => {
    let best = 0;
    let bd = Infinity;
    cs.forEach((c, i) => {
      const d = d2(p, c);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  });
}

function inertia(pts: P[], cs: P[]): number {
  const a = assign(pts, cs);
  return pts.reduce((s, p, i) => s + d2(p, cs[a[i]!]!), 0) / pts.length;
}

/** uma iteração de Lloyd; devolve se algum centróide mexeu */
function lloyd(pts: P[], cs: P[]): boolean {
  const a = assign(pts, cs);
  let moved = false;
  cs.forEach((c, i) => {
    const mine = pts.filter((_, j) => a[j] === i);
    if (!mine.length) return;
    const nx = mine.reduce((s, p) => s + p[0], 0) / mine.length;
    const ny = mine.reduce((s, p) => s + p[1], 0) / mine.length;
    if (Math.abs(nx - c[0]) > 1e-6 || Math.abs(ny - c[1]) > 1e-6) moved = true;
    c[0] = nx;
    c[1] = ny;
  });
  return moved;
}

function bestKnown(pts: P[], k: number, seed: number): number {
  const rand = mulberry32(seed * 7 + 1);
  let best = Infinity;
  for (let run = 0; run < 40; run++) {
    // k-means++: próximo centro sorteado com probabilidade proporcional a d²
    const cs: P[] = [[...pts[Math.floor(rand() * pts.length)]!] as P];
    while (cs.length < k) {
      const ds = pts.map((p) => Math.min(...cs.map((c) => d2(p, c))));
      let r = rand() * ds.reduce((a, b) => a + b, 0);
      let i = 0;
      while (r > ds[i]! && i < ds.length - 1) r -= ds[i++]!;
      cs.push([...pts[i]!] as P);
    }
    for (let it = 0; it < 100 && lloyd(pts, cs); it++);
    best = Math.min(best, inertia(pts, cs));
  }
  return best;
}

export function mountKMeans(host: HTMLElement, lang: Lang, onQuit: (summary: string) => void): void {
  const t = T[lang];
  const ui = shell(host, t.title, t.help);
  ui.setSize(W, H);
  const layers = GLYPH.map((_, i) => layer(`km__c${i}`));
  const cLayer = layer('km__centroid');
  ui.board.append(...layers, cLayer);
  ui.board.classList.add('mc__board--click');

  const picker = document.createElement('div');
  picker.className = 'mc__controls';
  ui.root.insertBefore(picker, ui.score);

  let li = 0;
  let pts: P[] = [];
  let cs: P[] = [];
  let best = 0;
  let sel = 0;
  let assisted = false;
  let timer = 0;
  let pickBtns: HTMLButtonElement[] = [];

  const stepBtn = ui.button(t.step, () => step(true));
  const runBtn = ui.button(t.run, run);
  const nextBtn = ui.button(t.next, () => li < LEVELS.length - 1 && load(li + 1));
  ui.button(t.quit, quit);
  void stepBtn;
  void runBtn;

  function load(i: number) {
    clearInterval(timer);
    li = i;
    const L = LEVELS[i]!;
    pts = makeData(L);
    best = bestKnown(pts, L.k, L.seed);
    // começa com todos os centróides amontoados num canto: início ruim de propósito
    cs = Array.from({ length: L.k }, (_, c) => [3 + c * 2, 1 + (c % 2)] as P);
    sel = 0;
    assisted = false;
    ui.message.textContent = '';
    picker.replaceChildren();
    pickBtns = cs.map((_, c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn km__pick km__pick--${c}`;
      b.textContent = `${NAMES[c]} ${GLYPH[c]}`;
      b.addEventListener('click', () => select(c));
      picker.append(b);
      return b;
    });
    ui.head.textContent = t.level(i + 1, LEVELS.length, L.k);
    render();
    ui.root.focus({ preventScroll: true });
  }

  function select(c: number) {
    sel = c;
    render();
  }

  function render() {
    const a = assign(pts, cs);
    const bufs = GLYPH.map(() => blank(W, H));
    pts.forEach(([x, y], j) => (bufs[a[j]!]![y]![x] = GLYPH[a[j]!]!));
    bufs.forEach((b, i) => (layers[i]!.textContent = join(b)));
    const cb = blank(W, H);
    cs.forEach(([x, y], i) => {
      const cx = Math.max(0, Math.min(W - 1, Math.round(x)));
      const cy = Math.max(0, Math.min(H - 1, Math.round(y)));
      cb[cy]![cx] = NAMES[i]!;
      if (i === sel) {
        if (cx > 0) cb[cy]![cx - 1] = '[';
        if (cx < W - 1) cb[cy]![cx + 1] = ']';
      }
    });
    cLayer.textContent = join(cb);
    pickBtns.forEach((b, i) => b.classList.toggle('is-active', i === sel));
    const v = inertia(pts, cs);
    ui.score.textContent = `${t.score(v, best)} ${t.selected(NAMES[sel]!)}`;
    const won = v <= best * 1.005;
    ui.root.classList.toggle('mc--won', won);
    nextBtn.disabled = !won || li === LEVELS.length - 1;
    if (won && !assisted) ui.message.textContent = li === LEVELS.length - 1 ? `${t.winSelf} ${t.allDone}` : t.winSelf;
  }

  function moveTo(x: number, y: number) {
    clearInterval(timer);
    assisted = false;
    ui.message.textContent = '';
    cs[sel] = [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
    render();
  }

  function step(single: boolean): boolean {
    if (single) clearInterval(timer);
    assisted = true;
    const moved = lloyd(pts, cs);
    render();
    return moved;
  }

  function run() {
    clearInterval(timer);
    let it = 0;
    timer = window.setInterval(() => {
      it++;
      const moved = step(false);
      if (!moved || it > 60) {
        clearInterval(timer);
        const v = inertia(pts, cs);
        ui.message.textContent = v <= best * 1.005 ? t.runBest(it) : t.runLocal(it, v, best);
      }
    }, 380);
  }

  ui.board.addEventListener('click', (e) => {
    const [x, y] = ui.cellAt(e, W, H);
    moveTo(x, y);
  });

  function onKey(e: KeyboardEvent) {
    const k = cs.length;
    const [x, y] = cs[sel]!;
    if (e.key >= '1' && e.key <= String(k)) select(Number(e.key) - 1);
    else if (e.key === 'ArrowLeft') moveTo(Math.round(x) - 1, Math.round(y));
    else if (e.key === 'ArrowRight') moveTo(Math.round(x) + 1, Math.round(y));
    else if (e.key === 'ArrowUp') moveTo(Math.round(x), Math.round(y) - 1);
    else if (e.key === 'ArrowDown') moveTo(Math.round(x), Math.round(y) + 1);
    else if (e.key === 's') step(true);
    else if (e.key === 'r') run();
    else if (e.key === 'n' && !nextBtn.disabled) load(li + 1);
    else if (e.key === 'q' || e.key === 'Escape') quit();
    else return;
    e.preventDefault();
  }
  ui.root.addEventListener('keydown', onKey);

  function quit() {
    clearInterval(timer);
    ui.root.removeEventListener('keydown', onKey);
    const summary = `${t.level(li + 1, LEVELS.length, LEVELS[li]!.k)} ${t.score(inertia(pts, cs), best)}`;
    ui.root.remove();
    onQuit(summary);
  }

  load(0);
}
