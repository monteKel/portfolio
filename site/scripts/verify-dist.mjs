// Varre o build e falha se algo quebrar a CSP rígida ou puxar recurso de terceiro.
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const problems = [];
const todos = [];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
for (const f of files) {
  const ext = extname(f);
  if (ext === '.html') {
    const html = await readFile(f, 'utf8');
    const rel = f.replace(DIST, '');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1];
      if (!/\bsrc=/.test(attrs) && m[2].trim() && !/type="application\/(ld\+)?json"/.test(attrs))
        problems.push(`${rel}: script embutido`);
      const src = attrs.match(/\bsrc="([^"]+)"/)?.[1];
      if (src && /^(https?:)?\/\//.test(src)) problems.push(`${rel}: script de terceiro ${src}`);
    }
    if (/<style\b/i.test(html)) problems.push(`${rel}: <style> embutido`);
    if (/\sstyle="/i.test(html)) problems.push(`${rel}: atributo style=""`);
    if (/\son[a-z]+="/i.test(html)) problems.push(`${rel}: handler inline (on*="")`);
    for (const m of html.matchAll(/<(link|img|iframe|source|video|audio)\b[^>]*\b(?:href|src)="((?:https?:)?\/\/[^"]+)"/gi)) {
      if (m[1] === 'link' && /rel="(canonical|alternate)"/.test(m[0])) continue;
      problems.push(`${rel}: recurso externo ${m[2]}`);
    }
    for (const m of html.matchAll(/TODO\(kel\)[^<]*/g)) todos.push(`${rel}: ${m[0].trim().slice(0, 90)}`);
  }
  if (ext === '.js' || ext === '.css') {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/(?:url\(|import\(|from\s*)["']?(https?:\/\/[^"')\s]+)/g))
      problems.push(`${f.replace(DIST, '')}: referência externa ${m[1]}`);
  }
}

// fonte japonesa recortada: todo caractere CJK do build precisa estar no recorte
{
  const covered = new Set(await readFile(new URL('../src/fonts/ja/chars.txt', import.meta.url), 'utf8'));
  const isCjk = (c) => {
    const o = c.codePointAt(0);
    return o >= 0x2e80 || (o >= 0xff00 && o <= 0xffef);
  };
  const missing = new Set();
  for (const f of files) {
    if (!['.html', '.js'].includes(extname(f))) continue;
    for (const c of await readFile(f, 'utf8')) if (isCjk(c) && !covered.has(c)) missing.add(c);
  }
  if (missing.size)
    problems.push(`fonte japonesa sem: ${[...missing].join('')} (rode python3 scripts/subset-ja.py)`);
}

console.log(`\nverify-dist: ${files.length} arquivos`);
if (todos.length) {
  console.log(`\n${todos.length} pendências TODO(kel):`);
  for (const t of [...new Set(todos)]) console.log('  - ' + t);
}
if (problems.length) {
  console.error(`\nFALHOU (${problems.length}):`);
  for (const p of problems) console.error('  x ' + p);
  process.exit(1);
}
console.log('\nOK: sem script/style embutido, sem handler inline, sem recurso de terceiro.');
