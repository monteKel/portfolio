// Loop de animação compartilhado entre o worker e o modo fallback (thread principal).
import { FLASH, frame, makeGrid, type Camera, type Grid, type Pulse } from './core';
import { draw, type AtlasInfo } from './renderer';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Surface = HTMLCanvasElement | OffscreenCanvas;

export interface EngineInit {
  canvas: Surface;
  atlas: CanvasImageSource;
  info: AtlasInfo;
  width: number; // px CSS
  height: number;
  dpr: number;
  reducedMotion: boolean;
}

export interface Params extends Camera {
  fps: number;
}

const raf: (cb: (t: number) => void) => number =
  typeof requestAnimationFrame === 'function'
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;

export class Engine {
  private ctx: Ctx2D;
  private grid!: Grid;
  private params: Params = { zoom: 1, cx: 0, cy: 0, fps: 30, mode: 0, holeK: 0 };
  private modeSince = -1;
  private pulses: Pulse[] = [];
  private lastAmbient = 0;
  private now = 0;
  private running = false;
  private paused = false;
  private last = 0;
  private start = performance.now();
  private pausedAt = 0;

  constructor(private init: EngineInit) {
    const ctx = init.canvas.getContext('2d', { alpha: true }) as Ctx2D | null;
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.resize(init.width, init.height, init.dpr);
  }

  resize(width: number, height: number, dpr: number): void {
    this.init.width = width;
    this.init.height = height;
    this.init.dpr = dpr;
    const { cellW, cellH } = this.init.info;
    const cols = Math.max(1, Math.floor(width / cellW));
    const rows = Math.max(1, Math.floor(height / cellH));
    this.init.canvas.width = Math.round(width * dpr);
    this.init.canvas.height = Math.round(height * dpr);
    this.grid = makeGrid(cols, rows, cellW, cellH);
    if (this.init.reducedMotion) this.renderStill();
  }

  /** meia-largura visível, em unidades de Y: a página usa para posicionar o buraco */
  get halfWidth(): number {
    return this.grid.halfW;
  }

  setParams(p: Partial<Params>): void {
    if (p.mode === 1 && this.params.mode !== 1) this.modeSince = this.now;
    if (p.mode === 0) this.modeSince = -1;
    Object.assign(this.params, p);
    if (this.init.reducedMotion) this.renderStill();
  }

  /** onda saindo de um ponto qualquer (clique do visitante), em unidades de Y */
  pulseAt(x: number, y: number, amp: number): void {
    if (this.init.reducedMotion || this.params.mode !== 1 || (this.params.holeK ?? 0) < 0.99) return;
    this.pulses.push({ t0: this.now, amp, ox: x, oy: y });
    if (this.pulses.length > 4) this.pulses.shift();
  }

  /** emite uma frente de onda; center = sai do meio da tela (a "saída" do buraco) */
  pulse(amp: number, center: boolean): void {
    if (this.init.reducedMotion) return;
    // ondas só depois que o buraco pequeno terminou de aparecer
    if (this.params.mode !== 1 || (this.params.holeK ?? 0) < 0.99) return;
    const p = this.params;
    this.pulses.push({ t0: this.now, amp, ox: center ? 0 : p.cx, oy: center ? 0 : p.cy });
    if (this.pulses.length > 3) this.pulses.shift(); // no máximo 3 frentes ao mesmo tempo
  }

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) this.pausedAt = performance.now();
    else this.start += performance.now() - this.pausedAt; // não pula a linha do tempo
  }

  run(): void {
    if (this.init.reducedMotion) {
      this.renderStill();
      return;
    }
    if (this.running) return;
    this.running = true;
    const tick = (now: number) => {
      if (!this.running) return;
      raf(tick);
      if (this.paused) return;
      const minGap = 1000 / this.params.fps;
      if (now - this.last < minGap - 1) return;
      this.last = now;
      this.render((now - this.start) / 1000);
    };
    raf(tick);
  }

  private renderStill(): void {
    // movimento reduzido: um quadro fixo, já com o disco formado e sem flash
    this.render(FLASH + 6);
  }

  private render(t: number): void {
    this.now = t;
    if (this.params.mode === 1) {
      // o buraco pequeno só aparece depois da animação inicial (flash) e da queda terminarem
      if (this.modeSince < 0) this.modeSince = t;
      const ready = Math.max(this.modeSince + 0.3, FLASH + 1.5);
      this.params.holeK = Math.min(1, Math.max(0, (t - ready) / 1.4));
      // um pulso ambiente a cada ~9 s para a página nunca ficar parada
      if (this.params.holeK >= 1 && t - this.lastAmbient > 9) {
        this.lastAmbient = t;
        this.pulse(0.6, false);
      }
      this.pulses = this.pulses.filter((p) => t - p.t0 < 7);
    }
    frame(t, this.grid, this.params, this.pulses);
    draw(this.ctx, this.init.atlas, this.init.info, this.grid, this.init.dpr);
  }
}
