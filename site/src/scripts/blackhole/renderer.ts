// Desenha a grade de códigos num canvas 2D usando um atlas de glifos pré-renderizado:
// um drawImage por célula acesa, sem trocar fillStyle/font por célula.
import { COLOR_COUNT, GLYPHS, LEVELS, type Grid } from './core';

// 0 estrelas/poeira, depois a rampa de calor do disco de acreção
export const PALETTE = ['#d4d4d4', '#ff4a1c', '#ff7b1c', '#ffad33', '#ffdb80', '#fff8ec'] as const;

export interface AtlasInfo {
  tileW: number; // px do dispositivo
  tileH: number;
  perRow: number;
  cellW: number; // px CSS
  cellH: number;
  fontPx: number;
}

export const FONT_FAMILY = '"Martian Mono Variable", ui-monospace, Menlo, Consolas, monospace';

/** Mede a célula e desenha todos os glifos x cores x níveis. Roda na thread principal. */
export function buildAtlas(fontPx: number, dpr: number): { canvas: HTMLCanvasElement; info: AtlasInfo } {
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `400 ${fontPx}px ${FONT_FAMILY}`;
  const cellW = probe.measureText('M').width;
  const cellH = Math.round(fontPx * 1.3);

  const tileW = Math.ceil(cellW * dpr);
  const tileH = Math.ceil(cellH * dpr);
  const total = GLYPHS.length * COLOR_COUNT * LEVELS;
  const perRow = 64;
  const rows = Math.ceil(total / perRow);

  const canvas = document.createElement('canvas');
  canvas.width = perRow * tileW;
  canvas.height = rows * tileH;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `400 ${fontPx * dpr}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  let tile = 0;
  for (let g = 0; g < GLYPHS.length; g++) {
    for (let c = 0; c < COLOR_COUNT; c++) {
      for (let l = 0; l < LEVELS; l++) {
        const sx = (tile % perRow) * tileW;
        const sy = Math.floor(tile / perRow) * tileH;
        ctx.globalAlpha = (l + 1) / LEVELS;
        ctx.fillStyle = PALETTE[c]!;
        ctx.fillText(GLYPHS[g]!, sx + tileW / 2, sy + tileH / 2);
        tile++;
      }
    }
  }
  return { canvas, info: { tileW, tileH, perRow, cellW, cellH, fontPx } };
}

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Source = CanvasImageSource;

export function draw(ctx: Ctx2D, atlas: Source, info: AtlasInfo, grid: Grid, dpr: number): void {
  const { out, cols } = grid;
  const { tileW, tileH, perRow, cellW, cellH } = info;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const stepX = cellW * dpr;
  const stepY = cellH * dpr;
  for (let k = 0; k < out.length; k++) {
    const code = out[k]!;
    if (code === 0) continue;
    const tile = code - 1;
    const sx = (tile % perRow) * tileW;
    const sy = Math.floor(tile / perRow) * tileH;
    const i = k % cols;
    const j = (k - i) / cols;
    ctx.drawImage(atlas, sx, sy, tileW, tileH, Math.round(i * stepX), Math.round(j * stepY), tileW, tileH);
  }
}
