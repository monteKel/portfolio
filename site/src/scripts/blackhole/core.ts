// Buraco negro ASCII: port célula-a-célula do frame() em numpy enviado pelo Kel.
// As funções auxiliares que não vieram no trecho (grid, gas, smooth, spin, ripple,
// tangent_letter, accretion_disk, tabelas e constantes) foram escritas aqui a partir
// de como o frame() as usa. Trocar pelas originais quando chegarem.
// Roda igual no worker e na thread principal: nada de DOM aqui.

export const TAU = Math.PI * 2;
export const R0 = 0.3; // raio da sombra
export const R_IN = 1.5 * R0; // borda interna do disco
export const R_OUT = 3.6 * R0; // borda externa do disco
export const TILT = -0.16; // giro do disco na tela (rad)
export const INC = 1.36; // inclinação (quase de lado)
export const FLASH = 7.6; // segundo do flash + onda de choque
/** lado do disco que vem na sua direção sobe um tom na rampa de calor (Doppler) */
export const DOPPLER_SHIFT = true;

// ---------- glifos ----------
const FILL_ROWS = ['.,\'`-:;.,\'`-', '~=+<>^*;:~=+', 'xoaecz*?%sxo', '#@%&8B$0MW#@'];
const TANGENT = ['-', '\\', '|', '/'];
const EXTRA = ['.'];

export const GLYPHS: string[] = [...new Set([...FILL_ROWS.join(''), ...TANGENT, ...EXTRA])];
const AT = new Map(GLYPHS.map((g, i) => [g, i] as const));
const FILL: Uint8Array[] = FILL_ROWS.map((row) => Uint8Array.from([...row].map((c) => AT.get(c)!)));
const TANGENT_IDX = Uint8Array.from(TANGENT.map((c) => AT.get(c)!));
const DOT = AT.get('.')!;
const DOT_STAR = AT.get('*')!;

// cores do atlas: 0 cinza (estrelas/poeira), 1-5 rampa de calor do disco:
// brasa, laranja, âmbar, dourado, branco quente (mesmos limiares do 'tag' do frame() original)
export const COLOR_COUNT = 6;

function heatTag(heat: number): number {
  return heat < 0.1 ? 0 : heat < 0.2 ? 1 : heat < 0.45 ? 2 : heat < 0.75 ? 3 : 4;
}
export const LEVELS = 8;

/** código da célula: 0 = vazia; senão 1 + ((glyph*COLOR_COUNT + cor)*LEVELS + nível) */
function encode(glyph: number, color: number, lum: number): number {
  let level = Math.floor((lum / 0.95) * LEVELS);
  if (level < 0) level = 0;
  if (level >= LEVELS) level = LEVELS - 1;
  return 1 + ((glyph * COLOR_COUNT + color) * LEVELS + level);
}

// ---------- helpers ----------
function smooth(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

function clip01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function ripple(a: number, b: number, c: number): number {
  return 0.6 * Math.sin(a + 1.3 * Math.sin(b)) + 0.4 * Math.sin(0.7 * a - b + c);
}

function spin(t: number): number {
  return 0.55 * (0.45 + 0.55 * smooth((t - 4.5) / 3));
}

// gas() devolve 3 valores; para não alocar por célula, escreve aqui
let G_STREAK = 0;
let G_PHASE = 0;
let G_LR = 1;

function gas(phi: number, rho: number, t: number, w: number): void {
  const rr = rho > 1e-3 ? rho : 1e-3;
  const omega = w * Math.pow(R_IN / rr, 1.5) * 1.6; // rotação kepleriana: dentro gira mais rápido
  const a = phi + omega * t;
  const ring = 0.5 + 0.5 * Math.sin(rr * 46 + 1.7 * Math.sin(2 * a + rr * 9));
  const clump = 0.5 + 0.5 * ripple(3 * a, rr * 24 - 0.3 * t, 0.25 * t);
  G_STREAK = 0.3 + 0.7 * (0.55 * ring * clump + 0.45 * clump);
  let ph = (a / TAU) % 1;
  if (ph < 0) ph += 1;
  G_PHASE = ph;
  G_LR = Math.floor(rr * 7) & 1 ? 1 : -1;
}

let D_U = 0;
let D_V = 0;
let D_PHASE = 0;
let D_LR = 1;

function accretionDisk(X: number, Y: number, t: number, w: number, inc: number): number {
  const u = X * Math.cos(TILT) + Y * Math.sin(TILT);
  const v = -X * Math.sin(TILT) + Y * Math.cos(TILT);
  const ci = Math.max(Math.cos(inc), 0.06);
  const vd = v / ci; // desfaz o achatamento da perspectiva
  const rho = Math.hypot(u, vd);
  const phi = Math.atan2(vd, u);

  gas(phi, rho, t, w);
  const edge = smooth((rho - R_IN) / (0.25 * R0)) * smooth((R_OUT - rho) / (0.25 * R0));
  let heat = 1.5 * edge * G_STREAK * Math.pow(R_IN / Math.max(rho, 1e-5), 1.8);
  heat *= 1 - (0.22 * u) / Math.max(rho, 1e-5); // lado que vem na sua direção fica mais claro (Doppler)

  D_U = u;
  D_V = v;
  D_PHASE = G_PHASE;
  D_LR = G_LR;
  return heat;
}

function lensedHalo(r: number, ang: number, t: number, w: number): number {
  // o lado de trás do disco, curvado por cima e por baixo da sombra
  const top = 0.5 - 0.5 * Math.sin(ang - TILT);
  const side = Math.pow(Math.abs(Math.cos(ang - TILT)), 10);
  const out = Math.max(r - 1.1 * R0, 0);
  const band = Math.exp(-out / (0.2 * R0 + 0.24 * R0 * top + 0.45 * R0 * side));
  const rho = (1 - side) * (R_IN + Math.max(r - 1.0 * R0, 0) * 2.6) + side * r;
  gas(ang - TILT, rho, t, w);
  return 1.2 * band * G_STREAK * (0.5 + 0.8 * top) * (1 - 0.25 * Math.cos(ang - TILT));
}

function tangentLetter(dx: number, dy: number): number {
  // eixo y da tela aponta para baixo
  let a = Math.atan2(dy, dx);
  if (a < 0) a += Math.PI;
  const k = Math.round(a / (Math.PI / 4)) % 4;
  return TANGENT_IDX[k]!;
}

// ---------- grade ----------
export interface Grid {
  cols: number;
  rows: number;
  /** meia-largura visível em unidades de Y (Y vai de -1 a 1) */
  halfW: number;
  X: Float32Array;
  Y: Float32Array;
  rnd: Float32Array;
  hsh: Uint8Array;
  out: Uint16Array;
}

function hash01(i: number, j: number): number {
  // hash inteiro determinístico -> [0, 1)
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function makeGrid(cols: number, rows: number, cellW: number, cellH: number): Grid {
  const n = cols * rows;
  const X = new Float32Array(n);
  const Y = new Float32Array(n);
  const rnd = new Float32Array(n);
  const hsh = new Uint8Array(n);
  const unit = (rows * cellH) / 2; // pixels por unidade de Y
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      X[k] = ((i + 0.5 - cols / 2) * cellW) / unit;
      Y[k] = (j + 0.5 - rows / 2) / (rows / 2);
      rnd[k] = hash01(i, j);
      hsh[k] = Math.floor(hash01(j + 7919, i + 104729) * 12);
    }
  }
  return { cols, rows, halfW: (cols * cellW) / 2 / unit, X, Y, rnd, hsh, out: new Uint16Array(n) };
}

export interface Camera {
  /** zoom extra vindo do scroll (1 = normal) */
  zoom: number;
  /** centro do buraco, em unidades de Y */
  cx: number;
  cy: number;
  /** 0 = só o buraco (hero). 1 = órbita: buraco pequeno + ondas de radiação no resto da página */
  mode: number;
  /** 0-1: quanto o buraco pequeno (e as ondas) já apareceu no modo órbita */
  holeK?: number;
  /** posição do mouse em unidades de Y e intensidade (0 = sem mouse) */
  mx?: number;
  my?: number;
  mouseK?: number;
}

const LENS = 0.45; // força da lente gravitacional do cursor
const LENS_S2 = 0.05; // raio² da lente

/** frente de onda emitida num instante: anel que se expande a partir de (ox, oy) */
export interface Pulse {
  t0: number;
  amp: number;
  ox: number;
  oy: number;
}

const FAR = 4.6 * R0;

// ---------- frame ----------
// ---------- ondas de radiação (modo órbita) ----------
// distorce o raio: as frentes saem onduladas, não círculos perfeitos
function warp(r: number, ang: number, X: number, Y: number, t: number): number {
  return (
    r +
    0.22 * Math.sin(3 * ang + t * 0.45) +
    0.1 * Math.sin(7 * ang - t * 0.7 + r * 1.3) +
    0.14 * Math.sin(X * 2.1 + t * 0.35) * Math.cos(Y * 1.7 - t * 0.25)
  );
}

function waves(t: number, X: number, Y: number, cam: Camera, pulses: readonly Pulse[], rk: number): number {
  const dx = X - cam.cx;
  const dy = Y - cam.cy;
  const r = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  // ondas contínuas saindo do buraco: poucas, grossas e bem espaçadas
  const ph = warp(r, ang, X, Y, t) * 3.1 - t * 1.1;
  const a = 0.5 + 0.5 * Math.sin(ph);
  let v = Math.pow(a, 5) * 0.5 * Math.exp(-r * 0.18);
  // pulsos: frentes largas e onduladas que atravessam a tela inteira
  for (const p of pulses) {
    const life = t - p.t0;
    if (life < 0 || life > 7) continue;
    const px = X - p.ox;
    const py = Y - p.oy;
    const pa = Math.atan2(py, px);
    const pr = warp(Math.hypot(px, py), pa, X, Y, t);
    const R = life * 1.05;
    const w = 0.12 + life * 0.015;
    const front = Math.exp(-(((pr - R) / w) ** 2));
    if (front < 0.02) continue;
    const grain = 0.6 + 0.4 * Math.sin(pa * 5 + pr * 2 - t * 2.4);
    v += p.amp * front * Math.exp(-life * 0.38) * grain * (0.55 + 0.45 * rk);
  }
  return v;
}

export function frame(t: number, g: Grid, cam: Camera, pulses: readonly Pulse[] = []): void {
  const { X, Y, rnd, hsh, out } = g;
  const n = out.length;

  const camK = smooth(smooth((t - FLASH) * 0.3) / 2.6); // no flash: afasta um pouco
  const zoom = (1 + 0.28 * camK) * cam.zoom;
  const inc = INC + 0.09 * camK;
  const w = spin(t);
  const flash = Math.exp(-(((t - FLASH) / 0.22) ** 2));
  const ringK = smooth((t - 0.3) / 2.2);
  const diskOn = smooth((t - 5.0) / 2.0);
  const auraK = smooth((t - 2.2) / 1.8) * (1 - 0.65 * diskOn);
  const diskFade = smooth((t - 5.0) / 0.8);
  const haloFade = smooth((t - 5.0) / 2.2);
  const span = R0 + diskOn * (R_OUT * 1.1 - R0);
  const ringGain = 0.9 + 0.3 * smooth((t - 5) / 2);
  const dustK = 0.3 * smooth((t - 4.0) / 3.0);
  const shockOn = t > FLASH && t - FLASH < 4;
  const front = R0 + (t - FLASH) * 0.55;
  const shockAmp = Math.exp(-(t - FLASH) * 1.5);
  const sinT = Math.sin(TILT);
  const cosT = Math.cos(TILT);

  const mk = cam.mouseK ?? 0;
  const mx = cam.mx ?? 0;
  const my = cam.my ?? 0;
  const dustFrame = Math.floor(t * 8);

  for (let k = 0; k < n; k++) {
    // lente gravitacional do cursor: puxa a amostragem para perto do mouse (amplia o que está ali)
    let Xk = X[k]!;
    let Yk = Y[k]!;
    let md2 = 9;
    if (mk > 0.01) {
      const dxm = Xk - mx;
      const dym = Yk - my;
      md2 = dxm * dxm + dym * dym;
      if (md2 < 0.4) {
        const l = LENS * Math.exp(-md2 / LENS_S2) * mk;
        Xk -= dxm * l;
        Yk -= dym * l;
      }
    }
    const x = (Xk - cam.cx) / zoom;
    const y = (Yk - cam.cy + 0.02 * camK) / zoom;
    const r = Math.hypot(x, y);
    const rk = rnd[k]!;
    const inside = r < R0 * 0.97;

    let heat = 0;
    let disk = 0;
    let isRing = false;
    let phase = 0;
    let lr = 1;
    let u = 0;
    let ang = 0;

    const holeK = cam.mode === 1 ? (cam.holeK ?? 1) : 1;
    if ((r < FAR || shockOn) && holeK > 0.02) {
      ang = Math.atan2(y, x);

      // onda de choque (vale também longe do centro)
      let shock = 0;
      if (shockOn) shock = Math.exp(-(((r - front) / 0.03) ** 2)) * shockAmp;

      if (r < FAR) {
        // 1. o círculo se desenha
        const around = (((ang + Math.PI / 2) % TAU) + TAU) % TAU / TAU;
        const ring = Math.exp(-(((r - 1.02 * R0) / (0.045 * R0)) ** 2)) * smooth((ringK - around) * 12);

        // 2. brilho que respira em volta e assenta no plano do disco
        gas(ang - TILT, R_IN + Math.max(r - R0, 0) * 2.6, t, w);
        const rings = G_STREAK;
        let puff = 0.5 + 0.5 * ripple(2 * ang, 5 * r - 0.45 * t, 0.35 * t);
        puff = puff * (1 - diskOn) + rings * diskOn;
        const reach = 0.32 * R0 * (0.7 + 0.6 * puff);
        const aura = auraK * Math.pow(Math.exp(-Math.max(r - R0, 0) / reach), 1.6) * (1 - 0.3 * diskOn);

        // 3. o disco abre para os lados e acende
        disk = accretionDisk(x, y, t, w, inc);
        u = D_U;
        const v = D_V;
        phase = D_PHASE;
        lr = D_LR;
        disk *= diskFade * smooth((span - Math.abs(u)) / (0.6 * R0));
        const halo = lensedHalo(r, ang, t, w) * haloFade;

        // mistura "screen" para brilho, halo e disco se fundirem
        let soft = 1 - (1 - clip01(aura * 0.55)) * (1 - clip01(halo));
        soft = Math.max(soft, disk, halo);
        heat = Math.max(ring * ringGain, soft, shock);
        heat *= 1 + 1.4 * flash;

        const frontSide = v > 0;
        if (inside && !frontSide) heat = 0; // a sombra esconde o lado de trás
        if (inside && frontSide) heat = disk > 0.2 ? disk : 0;

        isRing = ring > aura * 0.8 && ring > disk && ring > halo && ring > 0.25;
        if (!(disk >= halo && disk > 0.25)) disk = 0; // daqui pra frente: só "é célula de disco?"
      } else {
        heat = shock * (1 + 1.4 * flash);
      }
    }

    if (heat > 0.07) {
      let level = Math.floor(heat * 3.6);
      if (level > 3) level = 3;
      let glyph: number;
      let tag = heatTag(heat);
      if (isRing) {
        glyph = tangentLetter(-Math.sin(ang), Math.cos(ang));
        tag = Math.max(tag, 3); // anel de fótons: sempre quente
      } else {
        const row = FILL[level]!;
        let idx = (hsh[k]! + Math.floor(phase * 2 * lr * 6)) % 12;
        if (idx < 0) idx += 12;
        glyph = row[idx]!;
        if (DOPPLER_SHIFT && disk > 0 && !inside) tag += u < 0 ? 1 : -1; // vem = mais quente, vai = mais frio
      }
      if (tag < 0) tag = 0;
      if (tag > 4) tag = 4;
      const color = 1 + tag;
      let lum = 0.5 + 0.9 * heat; // brilho maior: o disco precisa brilhar como fogo, não como brasa
      if (lum > 1.3) lum = 1.3;
      lum *= (0.45 + 0.55 * rk) * holeK;
      out[k] = encode(glyph, color, lum);
      continue;
    }

    // modo órbita: radiação passando pela tela, nas cores do disco
    if (cam.mode === 1 && !inside && holeK > 0.02) {
      const wv = waves(t, Xk, Yk, cam, pulses, rk) * holeK;
      if (wv > 0.1) {
        let level = Math.floor(wv * 3.6);
        if (level > 3) level = 3;
        const rr = Math.hypot(Xk - cam.cx, Yk - cam.cy);
        let idx = (hsh[k]! + Math.floor(t * 3 + rr * 2)) % 12;
        if (idx < 0) idx += 12;
        let tag = heatTag(wv);
        if (tag < 1) tag = 1;
        out[k] = encode(FILL[level]![idx]!, 1 + tag, Math.min(1, 0.38 + 0.72 * wv) * (0.65 + 0.35 * rk));
        continue;
      }
    }

    // poeira atraída pelo cursor: cintila em volta do mouse
    if (mk > 0.01 && md2 < 0.12 && !inside) {
      let r2 = (rk * 91.7 + dustFrame * 0.37) % 1;
      if (r2 < 0) r2 += 1;
      if (r2 > 1 - 0.22 * Math.exp(-md2 / 0.025) * mk) {
        out[k] = encode(r2 > 0.985 ? DOT_STAR : DOT, 3, 0.55 + 0.4 * r2);
        continue;
      }
    }

    // algumas estrelas e poeira atrás de tudo
    if (!inside && rk < 0.0025) {
      out[k] = encode(DOT, 0, 0.75 + 0.2 * Math.sin(0.8 * t + rk * 9000));
      continue;
    }
    if (!inside && dustK > 0) {
      const lane = Math.exp(-((((x * sinT + y * cosT) - 0.02) / 0.15) ** 2));
      if (rk > 1 - 0.015 * lane) {
        out[k] = encode(DOT, 0, dustK);
        continue;
      }
    }
    out[k] = 0;
  }
}
