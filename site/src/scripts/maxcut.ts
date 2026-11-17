// Max-Cut jogável dentro do terminal, em 5 níveis.
// Ótimo exato por enumeração em código Gray (até 20 nós).
// "resolver" roda busca local (1 troca por vez) a partir do SEU estado atual:
// nos níveis maiores ela costuma travar num ótimo local, e dá para ganhar dela.
// Segurança: nada de innerHTML; só createElement + textContent.

interface Level {
  w: number;
  h: number;
  nodes: [number, number][];
  edges: [number, number][];
}

const LEVELS: Level[] = [
  {
    w: 46,
    h: 13,
    nodes: [[5, 1], [22, 1], [40, 2], [43, 8], [30, 11], [13, 11], [2, 7], [22, 6]],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [0, 7], [1, 7], [2, 7], [4, 7], [6, 7], [3, 7], [5, 7],
    ],
  },
  {
    w: 60,
    h: 15,
    nodes: [
      [4, 2], [20, 1], [38, 1], [54, 3], [56, 9], [44, 13], [24, 13], [6, 11],
      [17, 7], [31, 6], [44, 7],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
      [8, 0], [8, 7], [8, 9], [9, 1], [9, 2], [9, 10], [10, 3], [10, 4],
      [10, 5], [8, 6], [9, 6], [1, 8], [2, 10],
    ],
  },
  {
    w: 62,
    h: 17,
    nodes: [
      [3, 2], [18, 1], [34, 1], [50, 2], [58, 7], [52, 14], [34, 16], [16, 15], [3, 10],
      [14, 7], [27, 5], [41, 6], [22, 11], [40, 11],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
      [9, 0], [9, 8], [9, 1], [9, 12], [10, 1], [10, 2], [10, 9], [10, 11],
      [11, 2], [11, 3], [11, 4], [11, 13], [12, 7], [12, 6], [12, 13],
      [13, 5], [13, 4], [13, 6], [10, 12], [11, 12], [8, 12], [3, 13],
    ],
  },
  // níveis 4 e 5: grade com diagonais (triângulos travam a busca local ~98% das vezes)
  {
    w: 70,
    h: 17,
    nodes: [
      [4, 1], [13, 3], [28, 2], [39, 2], [51, 3], [62, 1], [5, 9], [16, 7], [27, 8], [39, 8],
      [51, 8], [65, 7], [2, 15], [15, 15], [27, 14], [38, 13], [51, 14],
    ],
    edges: [
      [0, 1], [1, 2], [1, 7], [1, 8], [2, 3], [2, 8], [3, 8], [3, 4], [3, 9], [4, 9], [4, 5],
      [4, 10], [5, 10], [5, 11], [6, 7], [6, 12], [6, 13], [7, 8], [7, 13], [7, 14], [8, 9],
      [8, 14], [9, 14], [9, 10], [9, 15], [10, 15], [10, 11], [10, 16], [12, 13], [13, 14],
      [14, 15], [15, 16],
    ],
  },
  {
    w: 70,
    h: 19,
    nodes: [
      [4, 0], [18, 2], [35, 1], [48, 1], [63, 2], [3, 6], [17, 6], [32, 5], [48, 5], [63, 7],
      [2, 10], [16, 11], [33, 12], [47, 10], [64, 11], [4, 15], [19, 16], [34, 17], [47, 17], [62, 16],
    ],
    edges: [
      [0, 1], [0, 5], [1, 5], [1, 2], [1, 6], [1, 7], [2, 3], [2, 7], [3, 7], [3, 4], [3, 8],
      [4, 8], [4, 9], [5, 6], [5, 10], [6, 7], [6, 11], [7, 11], [7, 8], [7, 12], [8, 12],
      [8, 9], [8, 13], [9, 13], [9, 14], [10, 11], [10, 15], [10, 16], [11, 12], [11, 16],
      [12, 16], [12, 13], [12, 17], [13, 14], [13, 18], [14, 18], [14, 19], [15, 16], [16, 17],
      [17, 18], [18, 19],
    ],
  },
];

function cutSize(edges: [number, number][], side: Uint8Array): number {
  let c = 0;
  for (const [a, b] of edges) if (side[a] !== side[b]) c++;
  return c;
}

function optimum(level: Level): number {
  // enumera todos os cortes em código Gray (nó 0 fixo): cada passo troca 1 nó e
  // atualiza o corte só pelos vizinhos dele. 20 nós = 2^19 passos, poucos ms.
  const n = level.nodes.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of level.edges) {
    adj[a]!.push(b);
    adj[b]!.push(a);
  }
  const s = new Uint8Array(n);
  let c = 0;
  let best = 0;
  const total = 1 << (n - 1);
  for (let i = 1; i < total; i++) {
    const v = 1 + (31 - Math.clz32(i & -i));
    let d = 0;
    for (const u of adj[v]!) d += s[u] !== s[v] ? -1 : 1;
    s[v] = s[v] ? 0 : 1;
    c += d;
    if (c > best) best = c;
  }
  return best;
}

function edgeChar(dx: number, dy: number): string {
  // células são ~2x mais altas que largas: compara com dy dobrado
  const ax = Math.abs(dx);
  const ay = Math.abs(dy) * 2;
  if (ay < ax * 0.45) return '-';
  if (ax < ay * 0.45) return '|';
  return dx * dy > 0 ? '\\' : '/';
}

function rasterEdges(level: Level, side: Uint8Array): { cut: string; uncut: string } {
  const { w, h, nodes, edges } = level;
  const cut = Array.from({ length: h }, () => Array<string>(w).fill(' '));
  const uncut = Array.from({ length: h }, () => Array<string>(w).fill(' '));
  for (const [a, b] of edges) {
    const target = side[a] !== side[b] ? cut : uncut;
    const [x0, y0] = nodes[a]!;
    const [x1, y1] = nodes[b]!;
    const diag = edgeChar(x1 - x0, y1 - y0);
    // Bresenham: o caractere segue o movimento de cada passo (só x '-', só y '|', os dois diagonal)
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      let mx = false;
      let my = false;
      if (e2 >= dy) {
        err += dy;
        x += sx;
        mx = true;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
        my = true;
      }
      const ch = mx && my ? (diag === '-' || diag === '|' ? (sx * sy > 0 ? '\\' : '/') : diag) : mx ? '-' : '|';
      if (target[y]?.[x] === ' ') target[y]![x] = ch;
    }
  }
  // libera o espaço dos rótulos dos nós
  nodes.forEach(([x, y]) => {
    for (let d = -1; d <= 3; d++) {
      if (cut[y]?.[x + d] !== undefined) cut[y]![x + d] = ' ';
      if (uncut[y]?.[x + d] !== undefined) uncut[y]![x + d] = ' ';
    }
  });
  const join = (b: string[][]) => b.map((r) => r.join('')).join('\n');
  return { cut: join(cut), uncut: join(uncut) };
}

export interface GameText {
  title: string;
  help: string;
  level: (n: number, total: number) => string;
  score: (cut: number, total: number, best: number) => string;
  winSelf: (moves: number) => string;
  solverFound: (from: number, to: number, flips: number) => string;
  solverStuck: (from: number, to: number, flips: number, best: number) => string;
  solverNoMove: (cut: number, best: number) => string;
  allDone: string;
  shuffle: string;
  solve: string;
  next: string;
  quit: string;
  node: (n: number, group: string) => string;
}

export function mountMaxCut(host: HTMLElement, text: GameText, onQuit: (summary: string) => void): () => void {
  let li = 0;
  let level = LEVELS[0]!;
  let best = 0;
  let side = new Uint8Array(0);
  let moves = 0;
  let assisted = false;
  let solving = 0;

  const root = document.createElement('div');
  root.className = 'mc';
  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', text.title);

  const head = document.createElement('p');
  head.className = 'mc__level';
  const help = document.createElement('p');
  help.className = 'mc__help';
  help.textContent = text.help;

  const board = document.createElement('div');
  board.className = 'mc__board';
  const uncut = document.createElement('pre');
  uncut.className = 'mc__layer mc__layer--uncut';
  uncut.setAttribute('aria-hidden', 'true');
  const cut = document.createElement('pre');
  cut.className = 'mc__layer mc__layer--cut';
  cut.setAttribute('aria-hidden', 'true');
  board.append(uncut, cut);
  let buttons: HTMLButtonElement[] = [];

  const score = document.createElement('p');
  score.className = 'mc__score';
  score.setAttribute('aria-live', 'polite');
  const message = document.createElement('p');
  message.className = 'mc__msg';
  message.setAttribute('aria-live', 'polite');

  const controls = document.createElement('div');
  controls.className = 'mc__controls';
  const mk = (label: string, fn: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = label;
    b.addEventListener('click', fn);
    controls.append(b);
    return b;
  };
  mk(text.shuffle, shuffle);
  mk(text.solve, solve);
  const nextBtn = mk(text.next, nextLevel);
  mk(text.quit, quit);

  root.append(head, help, board, score, message, controls);
  host.append(root);

  function loadLevel(i: number) {
    clearInterval(solving);
    li = i;
    level = LEVELS[i]!;
    best = optimum(level);
    side = new Uint8Array(level.nodes.length);
    for (let k = 0; k < side.length; k++) side[k] = k % 3 === 0 ? 1 : 0;
    moves = 0;
    assisted = false;
    message.textContent = '';
    board.style.setProperty('--w', String(level.w));
    board.style.setProperty('--h', String(level.h));
    buttons.forEach((b) => b.remove());
    buttons = level.nodes.map(([x, y], k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc__node';
      b.style.setProperty('--x', String(x - 1));
      b.style.setProperty('--y', String(y));
      b.addEventListener('click', () => {
        assisted = false;
        moves++;
        flip(k);
      });
      board.append(b);
      return b;
    });
    head.textContent = text.level(i + 1, LEVELS.length);
    render();
  }

  function render() {
    const { cut: c, uncut: u } = rasterEdges(level, side);
    cut.textContent = c;
    uncut.textContent = u;
    buttons.forEach((b, i) => {
      const a = side[i] === 0;
      b.textContent = a ? `(${i + 1})` : `[${i + 1}]`;
      b.classList.toggle('mc__node--a', a);
      b.classList.toggle('mc__node--b', !a);
      b.setAttribute('aria-label', text.node(i + 1, a ? 'A' : 'B'));
    });
    const now = cutSize(level.edges, side);
    score.textContent = text.score(now, level.edges.length, best);
    const won = now === best;
    root.classList.toggle('mc--won', won);
    nextBtn.disabled = !won || li === LEVELS.length - 1;
    if (won && !assisted) message.textContent = li === LEVELS.length - 1 ? `${text.winSelf(moves)} ${text.allDone}` : text.winSelf(moves);
  }

  function flip(i: number) {
    side[i] = side[i] ? 0 : 1;
    render();
  }

  function shuffle() {
    clearInterval(solving);
    for (let i = 0; i < side.length; i++) side[i] = Math.random() < 0.5 ? 0 : 1;
    moves = 0;
    assisted = false;
    message.textContent = '';
    render();
  }

  // busca local a partir do estado atual: troca o nó que mais aumenta o corte, até travar
  function solve() {
    clearInterval(solving);
    const from = cutSize(level.edges, side);
    let flips = 0;
    assisted = true;
    solving = window.setInterval(() => {
      const base = cutSize(level.edges, side);
      let gain = 0;
      let who = -1;
      for (let i = 0; i < side.length; i++) {
        side[i] = side[i] ? 0 : 1;
        const g = cutSize(level.edges, side) - base;
        side[i] = side[i] ? 0 : 1;
        if (g > gain) {
          gain = g;
          who = i;
        }
      }
      if (who < 0) {
        clearInterval(solving);
        const to = cutSize(level.edges, side);
        if (flips === 0) message.textContent = text.solverNoMove(to, best);
        else if (to === best) message.textContent = text.solverFound(from, to, flips);
        else message.textContent = text.solverStuck(from, to, flips, best);
        return;
      }
      flips++;
      flip(who);
    }, 300);
  }

  function nextLevel() {
    if (li < LEVELS.length - 1) loadLevel(li + 1);
    root.focus({ preventScroll: true });
  }

  function onKey(e: KeyboardEvent) {
    if (e.key >= '1' && e.key <= '9' && Number(e.key) <= side.length) {
      assisted = false;
      moves++;
      flip(Number(e.key) - 1);
      e.preventDefault();
    } else if (e.key === 'r') shuffle();
    else if (e.key === 's') solve();
    else if (e.key === 'n' && !nextBtn.disabled) nextLevel();
    else if (e.key === 'q' || e.key === 'Escape') quit();
  }
  root.addEventListener('keydown', onKey);

  function quit() {
    clearInterval(solving);
    root.removeEventListener('keydown', onKey);
    const summary = `${text.level(li + 1, LEVELS.length)} ${text.score(cutSize(level.edges, side), level.edges.length, best)}`;
    root.remove();
    onQuit(summary);
  }

  loadLevel(0);
  root.focus({ preventScroll: true });
  return quit;
}
