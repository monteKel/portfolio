// Liga o buraco negro ao canvas da página.
// Preferência: worker + OffscreenCanvas. Sem suporte: mesma engine na thread principal.
import { buildAtlas, FONT_FAMILY } from './renderer';
import type { Params } from './engine';

export interface BlackHole {
  setParams(p: Partial<Params>): void;
  /** frente de onda de radiação (modo órbita) */
  pulse(amp: number, center?: boolean): void;
  /** onda saindo de um ponto da tela (px CSS) */
  pulseAtScreen(clientX: number, clientY: number, amp: number): void;
  /** posição do mouse na tela (px CSS); null = saiu */
  mouse(clientX: number | null, clientY?: number): void;
  /** meia-largura da tela em unidades de Y (para posicionar o buraco) */
  halfWidth(): number;
  /** pausa pedida pelo visitante (botão de pausar animações) */
  pause(paused: boolean): void;
}

function fontPxFor(width: number): number {
  return Math.max(9, Math.min(14, Math.round(width / 150)));
}

export async function mountBlackHole(canvas: HTMLCanvasElement, reducedMotion: boolean): Promise<BlackHole> {
  const fontPx = fontPxFor(window.innerWidth);
  try {
    await document.fonts.load(`400 ${fontPx}px ${FONT_FAMILY}`);
  } catch {
    /* segue com a fonte de fallback */
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { canvas: atlasCanvas, info } = buildAtlas(fontPx, dpr);
  const size = () => ({ width: canvas.clientWidth, height: canvas.clientHeight });

  let halfW = 1;
  let pending: Partial<Params> = {};
  let api: {
    params(p: Partial<Params>): void;
    resize(): void;
    pause(p: boolean): void;
    pulse(amp: number, center: boolean): void;
    pulseAt(x: number, y: number, amp: number): void;
  };

  const canWorker = typeof Worker !== 'undefined' && 'transferControlToOffscreen' in canvas;
  let usedWorker = false;
  let transferred = false;

  if (canWorker) {
    try {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      const offscreen = canvas.transferControlToOffscreen();
      transferred = true;
      const atlas = await createImageBitmap(atlasCanvas);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('worker timeout')), 4000);
        worker.onmessage = (e: MessageEvent<{ type: string; halfW?: number }>) => {
          if (e.data.type === 'ready' || e.data.type === 'resized') {
            halfW = e.data.halfW ?? halfW;
            clearTimeout(timer);
            resolve();
          } else if (e.data.type === 'error') {
            clearTimeout(timer);
            reject(new Error('worker error'));
          }
        };
        worker.onerror = () => {
          clearTimeout(timer);
          reject(new Error('worker failed'));
        };
        worker.postMessage(
          { type: 'init', canvas: offscreen, atlas, info, ...size(), dpr, reducedMotion },
          [offscreen, atlas],
        );
      });
      api = {
        params: (p) => worker.postMessage({ type: 'params', params: p }),
        resize: () => worker.postMessage({ type: 'resize', ...size(), dpr }),
        pause: (paused) => worker.postMessage({ type: 'pause', paused }),
        pulse: (amp, center) => worker.postMessage({ type: 'pulse', amp, center }),
        pulseAt: (x, y, amp) => worker.postMessage({ type: 'pulseAt', x, y, amp }),
      };
      usedWorker = true;
    } catch {
      usedWorker = false;
    }
  }

  if (!usedWorker) {
    // canvas pode ter sido transferido antes da falha: nesse caso, cria um novo no lugar
    let target = canvas;
    if (transferred) {
      target = canvas.cloneNode(false) as HTMLCanvasElement;
      canvas.replaceWith(target);
    }
    const { Engine } = await import('./engine');
    const engine = new Engine({ canvas: target, atlas: atlasCanvas, info, ...size(), dpr, reducedMotion });
    engine.run();
    halfW = engine.halfWidth;
    api = {
      params: (p) => engine.setParams(p),
      resize: () => {
        engine.resize(target.clientWidth, target.clientHeight, dpr);
        halfW = engine.halfWidth;
      },
      pause: (paused) => engine.setPaused(paused),
      pulse: (amp, center) => engine.pulse(amp, center),
      pulseAt: (x, y, amp) => engine.pulseAt(x, y, amp),
    };
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => api.resize(), 150);
  });
  let userPaused = false;
  const applyPause = () => api.pause(document.hidden || userPaused);
  document.addEventListener('visibilitychange', applyPause);

  // tela (px) -> unidades da grade (Y de -1 a 1; X na mesma escala, centrado)
  const toUnits = (cx: number, cy: number): [number, number] => {
    const h = canvas.clientHeight || window.innerHeight;
    const w = canvas.clientWidth || window.innerWidth;
    return [(cx - w / 2) / (h / 2), (cy / h) * 2 - 1];
  };
  let mouseK = 0;
  let mouseTarget = 0;
  let fadeRaf = 0;
  const fadeMouse = () => {
    // suaviza a entrada/saída do mouse (a lente não "liga" de uma vez)
    mouseK += (mouseTarget - mouseK) * 0.15;
    if (Math.abs(mouseTarget - mouseK) < 0.01) mouseK = mouseTarget;
    pending.mouseK = mouseK;
    flush();
    if (mouseK !== mouseTarget) fadeRaf = requestAnimationFrame(fadeMouse);
    else fadeRaf = 0;
  };

  // junta várias mudanças de parâmetro num envio por quadro
  let scheduled = false;
  const flush = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      api.params(pending);
      pending = {};
    });
  };
  return {
    pause(paused) {
      userPaused = paused;
      applyPause();
    },
    mouse(cx, cy) {
      if (cx === null || cy === undefined) mouseTarget = 0;
      else {
        const [x, y] = toUnits(cx, cy);
        pending.mx = x;
        pending.my = y;
        mouseTarget = 1;
        flush();
      }
      if (!fadeRaf) fadeRaf = requestAnimationFrame(fadeMouse);
    },
    pulseAtScreen(cx, cy, amp) {
      const [x, y] = toUnits(cx, cy);
      api.pulseAt(x, y, amp);
    },
    setParams(p) {
      Object.assign(pending, p);
      flush();
    },
    halfWidth: () => halfW,
    pulse(amp, center = false) {
      // manda params pendentes antes, para o pulso sair da posição certa
      if (Object.keys(pending).length) {
        api.params(pending);
        pending = {};
      }
      api.pulse(amp, center);
    },
  };
}
