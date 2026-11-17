// Gera preview/ a partir de dist/ com caminhos relativos (para hospedar em subpasta).
// Produção continua usando dist/ com caminhos absolutos.
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, extname, relative, dirname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'preview');
await rm(out, { recursive: true, force: true });
await cp(dist, out, { recursive: true });
await rm(join(out, '_headers'), { force: true });

async function walk(dir) {
  const r = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) r.push(...(await walk(p)));
    else r.push(p);
  }
  return r;
}

for (const f of await walk(out)) {
  const ext = extname(f);
  if (!['.html', '.js', '.css'].includes(ext)) continue;
  let s = await readFile(f, 'utf8');
  if (ext === '.html') {
    const up = relative(dirname(f), out) || '.';
    const pre = up === '.' ? './' : up + '/';
    s = s
      .replaceAll('"/assets/', `"${pre}assets/`)
      .replaceAll(', /assets/', `, ${pre}assets/`)
      .replaceAll('"/favicon.svg"', `"${pre}favicon.svg"`)
      .replaceAll('"/favicon.ico"', `"${pre}favicon.ico"`)
      .replaceAll('"/apple-touch-icon.png"', `"${pre}apple-touch-icon.png"`)
      .replaceAll('"/site.webmanifest"', `"${pre}site.webmanifest"`)
      .replaceAll('"/noscript.css"', `"${pre}noscript.css"`)
      .replaceAll('"/lang-gate.js"', `"${pre}lang-gate.js"`)
      .replace('data-alt-en="/"', `data-alt-en="${pre}index.html"`)
      .replace('data-alt-pt="/pt/"', `data-alt-pt="${pre}pt/index.html"`)
      .replace('data-alt-ja="/ja/"', `data-alt-ja="${pre}ja/index.html"`)
      .replaceAll('href="/ja/"', `href="${pre}ja/index.html"`)
      .replaceAll('href="/cv/', `href="${pre}cv/`)
      .replaceAll('href="/pt/"', `href="${pre}pt/index.html"`)
      .replaceAll('href="/"', `href="${pre}index.html"`)
      // o host da prévia já aplica a própria CSP e injeta o runtime dele: a meta CSP do site bloquearia
      .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
  } else {
    s = s.replaceAll('`/assets/', '`./').replaceAll('"/assets/', '"./').replaceAll('url(/assets/', 'url(./');
  }
  await writeFile(f, s);
}
console.log('preview/ pronto');
