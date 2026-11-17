# kel-portfolio

Personal site of Kelve Cartaxo. A terminal orbiting an ASCII black hole.

- `site/` Astro (static output), TypeScript strict, GSAP + ScrollTrigger + ScrambleText, Lenis.
- Black hole: port of a numpy `frame()` to TypeScript, running in a Web Worker on an OffscreenCanvas
  (`site/src/scripts/blackhole/`). Falls back to the main thread when OffscreenCanvas is missing.
  Paused when the tab is hidden; a single still frame with `prefers-reduced-motion`.
- All copy lives in `site/src/data/content.ts` (EN + PT). Missing data is marked `TODO(kel)` and shows up
  in red on the page and in the build log.

## Run
```bash
cd site
npm ci
npm run dev       # http://localhost:4321
npm run build     # astro check + build + security checks on dist/
```

## Deploy (Cloudflare Pages)
1. Push this repo to GitHub.
2. Cloudflare Pages → Create project → connect the repo.
3. Build command `npm run build`, output `dist`, root directory `site`, env `NODE_VERSION=22`.
4. Add the custom domain, then update `site` in `site/astro.config.mjs`.
5. Check headers at https://observatory.mozilla.org (target A+).

`site/public/_headers` only works on Cloudflare Pages / Netlify-style hosts. On GitHub Pages only the
`<meta>` CSP applies: no HSTS of your own, no `frame-ancestors`.

## Not done yet
- Contact form + FastAPI backend on the personal VM (current contact: email revealed on click).
- Photo → ASCII portrait.
- OG image.

## Japonês (/ja/)

- Fonte: IBM Plex Sans JP (OFL), recortada só para os caracteres usados e carregada só na página /ja/.
- Mudou texto em japonês? Rode `python3 scripts/subset-ja.py` (requer `pip install fonttools brotli`).
  O `verify-dist` falha o build se aparecer caractere fora do recorte.
- O script baixa a fonte com `npm pack` (não executa o `postinstall` de telemetria do pacote `@ibm/plex-sans-jp`).
  Não instale esse pacote como dependência.

## Auditoria (nov/2026)

- Lighthouse (mobile, com compressão e os headers de produção): 100 em desempenho, acessibilidade,
  boas práticas e SEO nas três versões. axe: 0 violações (WCAG 2.2 AA + boas práticas).
- Extras: página 404 própria, `sitemap.xml` com hreflang, `robots.txt`, `security.txt`,
  imagens de prévia de link (`python3 scripts/og.py`, com o build servido em localhost:4321),
  botão de pausar animações (WCAG 2.2.2) e links diretos para blocos (`/#contact`).
