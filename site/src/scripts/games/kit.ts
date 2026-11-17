// Peças comuns dos jogos do terminal. Só createElement + textContent (nada de innerHTML).

export type Lang = 'en' | 'pt' | 'ja';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

/** camada de texto sobreposta no tabuleiro; a cor vem da classe CSS */
export function layer(cls: string): HTMLPreElement {
  const p = el('pre', `mc__layer ${cls}`);
  p.setAttribute('aria-hidden', 'true');
  return p;
}

export function blank(w: number, h: number): string[][] {
  return Array.from({ length: h }, () => Array<string>(w).fill(' '));
}

export const join = (b: string[][]) => b.map((r) => r.join('')).join('\n');

export interface Shell {
  root: HTMLDivElement;
  head: HTMLParagraphElement;
  board: HTMLDivElement;
  score: HTMLParagraphElement;
  message: HTMLParagraphElement;
  controls: HTMLDivElement;
  button: (label: string, fn: () => void) => HTMLButtonElement;
  setSize: (w: number, h: number) => void;
  /** converte um clique no tabuleiro para (coluna, linha) */
  cellAt: (e: MouseEvent, w: number, h: number) => [number, number];
}

export function shell(host: HTMLElement, title: string, help: string): Shell {
  const root = el('div', 'mc');
  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', title);
  const head = el('p', 'mc__level');
  const helpP = el('p', 'mc__help', help);
  const board = el('div', 'mc__board');
  const score = el('p', 'mc__score');
  score.setAttribute('aria-live', 'polite');
  const message = el('p', 'mc__msg');
  message.setAttribute('aria-live', 'polite');
  const controls = el('div', 'mc__controls');
  root.append(head, helpP, board, score, message, controls);
  host.append(root);

  return {
    root,
    head,
    board,
    score,
    message,
    controls,
    button(label, fn) {
      const b = el('button', 'btn', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      controls.append(b);
      return b;
    },
    setSize(w, h) {
      board.style.setProperty('--w', String(w));
      board.style.setProperty('--h', String(h));
    },
    cellAt(e, w, h) {
      const r = board.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * w);
      const y = Math.floor(((e.clientY - r.top) / r.height) * h);
      return [Math.max(0, Math.min(w - 1, x)), Math.max(0, Math.min(h - 1, y))];
    },
  };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
