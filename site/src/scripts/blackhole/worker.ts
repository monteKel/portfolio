/// <reference lib="webworker" />
// Roda o buraco negro fora da thread principal: o scroll nunca espera a matemática.
import { Engine, type Params } from './engine';
import type { AtlasInfo } from './renderer';

type InMsg =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      atlas: ImageBitmap;
      info: AtlasInfo;
      width: number;
      height: number;
      dpr: number;
      reducedMotion: boolean;
    }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'params'; params: Partial<Params> }
  | { type: 'pause'; paused: boolean }
  | { type: 'pulse'; amp: number; center: boolean }
  | { type: 'pulseAt'; x: number; y: number; amp: number };

const scope = self as unknown as DedicatedWorkerGlobalScope;
let engine: Engine | null = null;

scope.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':
        engine = new Engine(msg);
        engine.run();
        scope.postMessage({ type: 'ready', halfW: engine.halfWidth });
        break;
      case 'resize':
        engine?.resize(msg.width, msg.height, msg.dpr);
        if (engine) scope.postMessage({ type: 'resized', halfW: engine.halfWidth });
        break;
      case 'params':
        engine?.setParams(msg.params);
        break;
      case 'pause':
        engine?.setPaused(msg.paused);
        break;
      case 'pulse':
        engine?.pulse(msg.amp, msg.center);
        break;
      case 'pulseAt':
        engine?.pulseAt(msg.x, msg.y, msg.amp);
        break;
    }
  } catch {
    scope.postMessage({ type: 'error' });
  }
};
