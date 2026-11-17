// Descida de gradiente jogável: você escolhe onde a bolinha começa, o learning rate e se
// usa momentum. Meta: chegar no mínimo global dentro do limite de passos.
// Nível 1 tigela, nível 2 dois vales (armadilha de mínimo local), nível 3 vale curvo (Rosenbrock).
import { blank, join, layer, shell, type Lang } from './kit';

const W = 56;
const H = 18;
const LRS = [0.01, 0.03, 0.1, 0.3, 0.6, 1.0];
const RAMP = ' .:-=+*#%@';

interface Level {
  f: (x: number, y: number) => number;
  budget: number;
  start: [number, number];
}

const LEVELS: Level[] = [
  {
    f: (x, y) => 0.8 * (x - 0.2) ** 2 + 1.6 * (y + 0.1) ** 2,
    budget: 40,
    start: [-0.8, 0.75],
  },
  {
    f: (x, y) =>
      0.35 * (x * x + y * y) -
      0.9 * Math.exp(-((x - 0.55) ** 2 + (y - 0.35) ** 2) / 0.06) -
      0.6 * Math.exp(-((x + 0.45) ** 2 + (y + 0.3) ** 2) / 0.18),
    budget: 60,
    start: [-0.85, -0.7],
  },
  {
    f: (x, y) => {
      const X = 1.6 * x;
      const Y = 1.6 * y;
      return (0.8 - X) ** 2 + 5 * (Y - X * X) ** 2;
    },
    budget: 60,
    start: [-0.8, 0.8],
  },
];

const T = {
  en: {
    title: 'gradient descent',
    help: 'Roll the ball to the lowest point of the loss surface. Brighter = lower loss. Click the board to choose where it starts, pick a learning rate and turn momentum on or off. step moves once, run goes until it stops or runs out of steps. Keys: [ ] learning rate, m momentum, s step, r run, n next level, q quit.',
    level: (n: number, t: number, b: number) => `level ${n}/${t}. ${b} steps allowed.`,
    score: (loss: number, min: number, used: number, b: number) =>
      `loss ${loss.toFixed(3)}. global minimum ${min.toFixed(3)}. steps ${used}/${b}.`,
    lr: (v: number) => `lr ${v}`,
    mom: (on: boolean) => `momentum ${on ? 'on' : 'off'}`,
    win: (n: number) => `reached the global minimum in ${n} steps.`,
    local: (l: number, m: number) =>
      `stopped at loss ${l.toFixed(3)}: a local minimum (global is ${m.toFixed(3)}). try another start, or momentum.`,
    diverged: 'diverged: the learning rate is too high, every step overshoots.',
    budget: (l: number) => `out of steps at loss ${l.toFixed(3)}. a larger learning rate, or momentum, gets there faster.`,
    allDone: 'that was the last level.',
    step: 'step',
    run: 'run',
    reset: 'reset',
    next: 'next level',
    quit: 'quit',
  },
  pt: {
    title: 'descida de gradiente',
    help: 'Leve a bolinha até o ponto mais baixo da superfície de erro. Mais claro = erro menor. Clique no tabuleiro para escolher onde ela começa, escolha o learning rate e ligue ou desligue o momentum. passo anda uma vez, rodar vai até parar ou acabar os passos. Teclas: [ ] learning rate, m momentum, s passo, r rodar, n próximo nível, q sai.',
    level: (n: number, t: number, b: number) => `nível ${n}/${t}. ${b} passos permitidos.`,
    score: (loss: number, min: number, used: number, b: number) =>
      `erro ${loss.toFixed(3)}. mínimo global ${min.toFixed(3)}. passos ${used}/${b}.`,
    lr: (v: number) => `lr ${v}`,
    mom: (on: boolean) => `momentum ${on ? 'ligado' : 'desligado'}`,
    win: (n: number) => `chegou no mínimo global em ${n} passos.`,
    local: (l: number, m: number) =>
      `parou no erro ${l.toFixed(3)}: um mínimo local (o global é ${m.toFixed(3)}). tente outro início, ou momentum.`,
    diverged: 'divergiu: o learning rate está alto demais, cada passo passa do ponto.',
    budget: (l: number) => `acabaram os passos no erro ${l.toFixed(3)}. um learning rate maior, ou momentum, chega mais rápido.`,
    allDone: 'esse era o último nível.',
    step: 'passo',
    run: 'rodar',
    reset: 'recomeçar',
    next: 'próximo nível',
    quit: 'sair',
  },
  ja: {
    title: '勾配降下法',
    help: 'ボールを損失曲面のいちばん低い点まで転がしてください。明るいほど損失が小さくなります。盤面をクリックして開始位置を決め、学習率を選び、モメンタムをオン／オフします。「ステップ」で1回動き、「実行」で止まるかステップを使い切るまで進みます。キー: [ ] 学習率、m モメンタム、s ステップ、r 実行、n 次のレベル、q 終了。',
    level: (n: number, t: number, b: number) => `レベル ${n}/${t}。使えるステップは ${b} 回。`,
    score: (loss: number, min: number, used: number, b: number) =>
      `損失 ${loss.toFixed(3)}。大域的最小値 ${min.toFixed(3)}。ステップ ${used}/${b}。`,
    lr: (v: number) => `lr ${v}`,
    mom: (on: boolean) => `モメンタム ${on ? 'オン' : 'オフ'}`,
    win: (n: number) => `${n} ステップで大域的最小値に到達しました。`,
    local: (l: number, m: number) =>
      `損失 ${l.toFixed(3)} で止まりました。局所最小値です（大域的最小値は ${m.toFixed(3)}）。別の開始位置か、モメンタムを試してください。`,
    diverged: '発散しました。学習率が高すぎて、毎ステップ行き過ぎています。',
    budget: (l: number) => `損失 ${l.toFixed(3)} でステップを使い切りました。学習率を上げるか、モメンタムを使うと早く着きます。`,
    allDone: 'これが最後のレベルでした。',
    step: 'ステップ',
    run: '実行',
    reset: 'リセット',
    next: '次のレベル',
    quit: '終了',
  },
};

const toX = (c: number) => -1 + (2 * (c + 0.5)) / W;
const toY = (r: number) => -1 + (2 * (r + 0.5)) / H;
const toCol = (x: number) => Math.round(((x + 1) / 2) * W - 0.5);
const toRow = (y: number) => Math.round(((y + 1) / 2) * H - 0.5);

export function mountDescent(host: HTMLElement, lang: Lang, onQuit: (summary: string) => void): void {
  const t = T[lang];
  const ui = shell(host, t.title, t.help);
  ui.setSize(W, H);
  ui.board.classList.add('mc__board--click');
  const bands = [layer('gd__b0'), layer('gd__b1'), layer('gd__b2'), layer('gd__b3')];
  const trailL = layer('gd__trail');
  const ballL = layer('gd__ball');
  ui.board.append(...bands, trailL, ballL);

  let li = 0;
  let L = LEVELS[0]!;
  let fmin = 0;
  let pos: [number, number] = [0, 0];
  let vel: [number, number] = [0, 0];
  let trail: [number, number][] = [];
  let used = 0;
  let lrIdx = 2;
  let momentum = false;
  let done = false;
  let won = false;
  let timer = 0;

  const lrBtn = ui.button('', () => setLr(lrIdx + 1));
  const momBtn = ui.button('', () => toggleMomentum());
  ui.button(t.step, () => {
    clearInterval(timer);
    advance();
  });
  ui.button(t.run, run);
  ui.button(t.reset, () => reset(pos0));
  const nextBtn = ui.button(t.next, () => li < LEVELS.length - 1 && load(li + 1));
  ui.button(t.quit, quit);
  let pos0: [number, number] = [0, 0];

  function drawSurface() {
    const vals: number[] = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) vals.push(L.f(toX(c), toY(r)));
    const lo = Math.min(...vals);
    const sorted = [...vals].sort((a, b) => a - b);
    const hi = sorted[Math.floor(sorted.length * 0.9)]!; // corta extremos: mais contraste no que importa
    const bufs = bands.map(() => blank(W, H));
    vals.forEach((v, i) => {
      const n = Math.min(1, Math.max(0, (v - lo) / (hi - lo || 1)));
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor((1 - n) * (RAMP.length - 1)))]!;
      const band = n < 0.08 ? 3 : n < 0.25 ? 2 : n < 0.55 ? 1 : 0;
      const r = Math.floor(i / W);
      bufs[band]![r]![i % W] = ch;
    });
    bufs.forEach((b, i) => (bands[i]!.textContent = join(b)));
  }

  function load(i: number) {
    clearInterval(timer);
    li = i;
    L = LEVELS[i]!;
    // mínimo global por varredura fina
    fmin = Infinity;
    for (let a = -1; a <= 1; a += 0.004) for (let b = -1; b <= 1; b += 0.004) fmin = Math.min(fmin, L.f(a, b));
    drawSurface();
    ui.head.textContent = t.level(i + 1, LEVELS.length, L.budget);
    pos0 = [...L.start];
    reset(pos0);
    ui.root.focus({ preventScroll: true });
  }

  function reset(p: [number, number]) {
    clearInterval(timer);
    pos = [...p];
    vel = [0, 0];
    trail = [];
    used = 0;
    done = false;
    won = false;
    ui.message.textContent = '';
    render();
  }

  function setLr(i: number) {
    lrIdx = ((i % LRS.length) + LRS.length) % LRS.length;
    render();
  }
  function toggleMomentum() {
    momentum = !momentum;
    render();
  }

  function grad(x: number, y: number): [number, number] {
    const h = 1e-4;
    return [(L.f(x + h, y) - L.f(x - h, y)) / (2 * h), (L.f(x, y + h) - L.f(x, y - h)) / (2 * h)];
  }

  function finish(msg: string, isWin: boolean) {
    clearInterval(timer);
    done = true;
    won = isWin;
    ui.message.textContent = isWin && li === LEVELS.length - 1 ? `${msg} ${t.allDone}` : msg;
    render();
  }

  /** um passo de descida; devolve false quando parou */
  function advance(): boolean {
    if (done) return false;
    const [gx, gy] = grad(pos[0], pos[1]);
    const lr = LRS[lrIdx]!;
    if (momentum) {
      vel = [0.85 * vel[0] + gx, 0.85 * vel[1] + gy];
    } else {
      vel = [gx, gy];
    }
    const prev: [number, number] = [...pos];
    trail.push(prev);
    pos = [pos[0] - lr * vel[0], pos[1] - lr * vel[1]];
    used++;
    const loss = L.f(pos[0], pos[1]);
    const range = Math.abs(L.f(L.start[0], L.start[1]) - fmin) || 1;
    const moved = Math.hypot(pos[0] - prev[0], pos[1] - prev[1]);

    if (!Number.isFinite(loss) || Math.abs(pos[0]) > 1.6 || Math.abs(pos[1]) > 1.6) {
      finish(t.diverged, false);
      return false;
    }
    if (loss - fmin < 0.004 + 0.002 * range) {
      finish(t.win(used), true);
      return false;
    }
    if (moved < 1e-4 && Math.hypot(vel[0], vel[1]) < 0.05) {
      finish(t.local(loss, fmin), false);
      return false;
    }
    if (used >= L.budget) {
      finish(t.budget(loss), false);
      return false;
    }
    render();
    return true;
  }

  function run() {
    clearInterval(timer);
    timer = window.setInterval(() => {
      if (!advance()) clearInterval(timer);
    }, 110);
  }

  function render() {
    const tb = blank(W, H);
    trail.forEach(([x, y]) => {
      const c = toCol(x);
      const r = toRow(y);
      if (tb[r]?.[c] !== undefined) tb[r]![c] = '*';
    });
    trailL.textContent = join(tb);
    const bb = blank(W, H);
    const c = toCol(pos[0]);
    const r = toRow(pos[1]);
    if (bb[r]?.[c] !== undefined) bb[r]![c] = '@';
    ballL.textContent = join(bb);
    lrBtn.textContent = t.lr(LRS[lrIdx]!);
    momBtn.textContent = t.mom(momentum);
    momBtn.classList.toggle('is-active', momentum);
    ui.score.textContent = t.score(L.f(pos[0], pos[1]), fmin, used, L.budget);
    ui.root.classList.toggle('mc--won', won);
    nextBtn.disabled = !won || li === LEVELS.length - 1;
  }

  ui.board.addEventListener('click', (e) => {
    const [c, r] = ui.cellAt(e, W, H);
    pos0 = [toX(c), toY(r)];
    reset(pos0);
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === '[') setLr(lrIdx - 1);
    else if (e.key === ']') setLr(lrIdx + 1);
    else if (e.key === 'm') toggleMomentum();
    else if (e.key === 's') {
      clearInterval(timer);
      advance();
    } else if (e.key === 'r') run();
    else if (e.key === 'n' && !nextBtn.disabled) load(li + 1);
    else if (e.key === 'q' || e.key === 'Escape') quit();
    else return;
    e.preventDefault();
  }
  ui.root.addEventListener('keydown', onKey);

  function quit() {
    clearInterval(timer);
    ui.root.removeEventListener('keydown', onKey);
    const summary = `${t.level(li + 1, LEVELS.length, L.budget)} ${t.score(L.f(pos[0], pos[1]), fmin, used, L.budget)}`;
    ui.root.remove();
    onQuit(summary);
  }

  load(0);
}
