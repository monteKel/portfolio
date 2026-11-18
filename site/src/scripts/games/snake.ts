// Snake no terminal: coma os bits, não bata na parede nem em você mesmo.
// Cada casa tem 2 caracteres de largura (fica quase quadrada com a fonte mono).
// Só createElement + textContent (nada de innerHTML).
import { blank, el, join, layer, shell, type Lang } from './kit';

type Dir = 0 | 1 | 2 | 3; // cima, direita, baixo, esquerda
const DX = [0, 1, 0, -1] as const;
const DY = [-1, 0, 1, 0] as const;
const KEYS: Record<string, Dir> = {
  ArrowUp: 0, w: 0, W: 0, k: 0,
  ArrowRight: 1, d: 1, D: 1, l: 1,
  ArrowDown: 2, s: 2, S: 2, j: 2,
  ArrowLeft: 3, a: 3, A: 3, h: 3,
};
const BEST_KEY = 'kel.snake';

const T = {
  en: {
    title: 'snake',
    help: "Eat the bits (01) to grow. Don't hit the walls or your own tail. Arrow keys or WASD, swipe on the board or use the buttons. space pauses, r restarts, q quits.",
    ready: 'press an arrow, swipe or tap a button to start.',
    paused: 'paused. press space or an arrow to continue.',
    over: (s: number, b: number) => `game over: ${s} bits. best: ${b}. press r to play again.`,
    record: (s: number) => `new record: ${s} bits! press r to play again.`,
    score: (s: number, b: number) => `bits ${s}. best ${b}.`,
    summary: (b: number) => `snake: best ${b} bits.`,
    restart: 'restart',
    pause: 'pause',
    quit: 'quit',
    dirs: ['up', 'right', 'down', 'left'],
  },
  pt: {
    title: 'cobrinha',
    help: 'Coma os bits (01) para crescer. Não bata na parede nem no próprio rabo. Setas ou WASD, deslize o dedo no tabuleiro ou use os botões. espaço pausa, r recomeça, q sai.',
    ready: 'aperte uma seta, deslize ou toque num botão para começar.',
    paused: 'pausado. aperte espaço ou uma seta para continuar.',
    over: (s: number, b: number) => `fim: ${s} bits. recorde: ${b}. aperte r para jogar de novo.`,
    record: (s: number) => `recorde novo: ${s} bits! aperte r para jogar de novo.`,
    score: (s: number, b: number) => `bits ${s}. recorde ${b}.`,
    summary: (b: number) => `cobrinha: recorde ${b} bits.`,
    restart: 'recomeçar',
    pause: 'pausar',
    quit: 'sair',
    dirs: ['cima', 'direita', 'baixo', 'esquerda'],
  },
  ja: {
    title: 'スネーク',
    help: 'ビット（01）を食べて長くなろう。壁や自分の体にぶつかったら終わり。矢印キーか WASD、盤面をスワイプ、またはボタンで操作。スペースで一時停止、r でやり直し、q で終了。',
    ready: '矢印キー、スワイプ、またはボタンでスタート。',
    paused: '一時停止中。スペースか矢印キーで再開。',
    over: (s: number, b: number) => `ゲームオーバー：${s} ビット。最高記録：${b}。r でもう一度。`,
    record: (s: number) => `新記録：${s} ビット！r でもう一度。`,
    score: (s: number, b: number) => `ビット ${s}。最高 ${b}。`,
    summary: (b: number) => `スネーク：最高 ${b} ビット。`,
    restart: 'やり直し',
    pause: '一時停止',
    quit: '終了',
    dirs: ['上', '右', '下', '左'],
  },
};

function loadBest(): number {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  } catch {
    return 0;
  }
}
function saveBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* sem armazenamento: o recorde vale só nesta visita */
  }
}

export function mountSnake(host: HTMLElement, lang: Lang, onQuit: (summary: string) => void): () => void {
  const t = T[lang];
  // tela estreita: tabuleiro menor para a fonte não ficar minúscula
  const narrow = host.clientWidth < 460;
  const C = narrow ? 13 : 20; // colunas (casas)
  const R = narrow ? 13 : 12; // linhas
  const W = C * 2 + 2;
  const H = R + 2;

  const ui = shell(host, t.title, t.help);
  ui.head.textContent = t.title;
  ui.setSize(W, H);
  ui.board.classList.add('sn__board');
  const wall = layer('sn__wall');
  const body = layer('sn__body');
  const head = layer('sn__head');
  const food = layer('sn__food');
  ui.board.append(wall, body, food, head);

  // moldura fixa
  const frame = blank(W, H);
  for (let x = 0; x < W; x++) {
    frame[0]![x] = x === 0 || x === W - 1 ? '+' : '-';
    frame[H - 1]![x] = frame[0]![x]!;
  }
  for (let y = 1; y < H - 1; y++) {
    frame[y]![0] = '|';
    frame[y]![W - 1] = '|';
  }
  wall.textContent = join(frame);

  // direcional na tela (celular e mouse)
  const pad = el('div', 'sn__pad');
  const arrows = ['^', '>', 'v', '<'];
  ([0, 3, 2, 1] as Dir[]).forEach((d) => {
    const b = el('button', `btn sn__key sn__key--${d}`, arrows[d]);
    b.type = 'button';
    b.setAttribute('aria-label', t.dirs[d]!);
    b.addEventListener('click', () => turn(d));
    pad.append(b);
  });
  ui.board.after(pad);

  ui.button(t.restart, reset);
  const pauseBtn = ui.button(t.pause, () => (state === 'run' ? pause() : state === 'paused' && resume()));
  ui.button(t.quit, quit);

  let snake: [number, number][] = [];
  let dir: Dir = 1;
  const queue: Dir[] = [];
  let bit: [number, number] = [0, 0];
  let score = 0;
  let best = loadBest();
  let state: 'ready' | 'run' | 'paused' | 'over' = 'ready';
  let timer = 0;

  function placeBit() {
    const free: [number, number][] = [];
    for (let y = 0; y < R; y++)
      for (let x = 0; x < C; x++) if (!snake.some(([sx, sy]) => sx === x && sy === y)) free.push([x, y]);
    bit = free[Math.floor(Math.random() * free.length)] ?? [0, 0];
  }

  function reset() {
    clearInterval(timer);
    const y = Math.floor(R / 2);
    snake = [[4, y], [3, y], [2, y]];
    dir = 1;
    queue.length = 0;
    score = 0;
    state = 'ready';
    placeBit();
    ui.message.textContent = t.ready;
    ui.root.classList.remove('mc--won');
    pauseBtn.disabled = true;
    draw();
    ui.root.focus({ preventScroll: true });
  }

  function speed() {
    return Math.max(70, 150 - score * 4);
  }

  function start() {
    state = 'run';
    ui.message.textContent = '';
    pauseBtn.disabled = false;
    clearInterval(timer);
    timer = window.setInterval(step, speed());
  }

  function pause() {
    if (state !== 'run') return;
    clearInterval(timer);
    state = 'paused';
    ui.message.textContent = t.paused;
  }

  function resume() {
    if (state === 'paused') start();
  }

  function turn(d: Dir) {
    if (state === 'over') return;
    // não deixa virar 180° (nem contra a última virada ainda na fila)
    const last = queue.length ? queue[queue.length - 1]! : dir;
    if (d !== last && (d + 2) % 4 !== last && queue.length < 3) queue.push(d);
    if (state === 'ready' || state === 'paused') {
      if ((d + 2) % 4 === dir && state === 'ready') queue.length = 0; // começa sem se morder
      start();
    }
  }

  function step() {
    if (queue.length) dir = queue.shift()!;
    const [hx, hy] = snake[0]!;
    const nx = hx + DX[dir];
    const ny = hy + DY[dir];
    const eating = nx === bit[0] && ny === bit[1];
    // o rabo sai do lugar no mesmo passo, então encostar nele não mata (a menos que esteja comendo)
    const bodyCheck = eating ? snake : snake.slice(0, -1);
    if (nx < 0 || ny < 0 || nx >= C || ny >= R || bodyCheck.some(([x, y]) => x === nx && y === ny)) {
      gameOver();
      return;
    }
    snake.unshift([nx, ny]);
    if (eating) {
      score++;
      if (snake.length < C * R) placeBit();
      clearInterval(timer);
      timer = window.setInterval(step, speed());
    } else snake.pop();
    draw();
  }

  function gameOver() {
    clearInterval(timer);
    state = 'over';
    pauseBtn.disabled = true;
    const record = score > best;
    if (record) {
      best = score;
      saveBest(best);
    }
    ui.root.classList.toggle('mc--won', record);
    ui.message.textContent = record ? t.record(score) : t.over(score, best);
    draw(true);
  }

  function draw(dead = false) {
    const b = blank(W, H);
    const hd = blank(W, H);
    const f = blank(W, H);
    snake.forEach(([x, y], i) => {
      const target = i === 0 ? hd : b;
      const cell = i === 0 ? (dead ? 'xx' : '@@') : '[]';
      target[y + 1]![x * 2 + 1] = cell[0]!;
      target[y + 1]![x * 2 + 2] = cell[1]!;
    });
    f[bit[1] + 1]![bit[0] * 2 + 1] = '0';
    f[bit[1] + 1]![bit[0] * 2 + 2] = '1';
    body.textContent = join(b);
    head.textContent = join(hd);
    food.textContent = join(f);
    ui.score.textContent = t.score(score, Math.max(best, score));
  }

  function onKey(e: KeyboardEvent) {
    const d = KEYS[e.key];
    if (d !== undefined) {
      e.preventDefault();
      turn(d);
    } else if (e.key === ' ' || e.key === 'p') {
      e.preventDefault();
      if (state === 'run') pause();
      else resume();
    } else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === 'q' || e.key === 'Escape') quit();
  }
  ui.root.addEventListener('keydown', onKey);

  // deslizar o dedo no tabuleiro
  let touch: [number, number] | null = null;
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    if (p) touch = [p.clientX, p.clientY];
  };
  const onTouchEnd = (e: TouchEvent) => {
    const p = e.changedTouches[0];
    if (!touch || !p) return;
    const dx = p.clientX - touch[0];
    const dy = p.clientY - touch[1];
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
  };
  ui.board.addEventListener('touchstart', onTouchStart, { passive: true });
  ui.board.addEventListener('touchend', onTouchEnd, { passive: true });

  // saiu do jogo (clicou fora, trocou de aba): pausa em vez de morrer sozinho
  const onFocusOut = (e: FocusEvent) => {
    if (!ui.root.contains(e.relatedTarget as Node | null)) pause();
  };
  const onHidden = () => document.hidden && pause();
  ui.root.addEventListener('focusout', onFocusOut);
  document.addEventListener('visibilitychange', onHidden);

  function quit() {
    clearInterval(timer);
    ui.root.removeEventListener('keydown', onKey);
    ui.root.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('visibilitychange', onHidden);
    const summary = t.summary(Math.max(best, score));
    ui.root.remove();
    onQuit(summary);
  }

  reset();
  return quit;
}
