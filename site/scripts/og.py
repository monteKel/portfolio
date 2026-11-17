#!/usr/bin/env python3
"""Gera as imagens de prévia de link (Open Graph, 1200x630) a partir do próprio site.

Uso: com o build servido em http://localhost:4321 (python3 -m http.server 4321 --directory dist),
rode python3 scripts/og.py. Requer playwright + Chrome. Saída: public/og/og-{en,pt,ja}.jpg
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4321'
CHROME = '/usr/bin/google-chrome'
HIDE = '.status, .hero__hint, .hero__prompt, .trail { visibility: hidden !important; }'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        for lang, path in [('en', '/'), ('pt', '/pt/'), ('ja', '/ja/')]:
            ctx = await b.new_context(viewport={'width': 1200, 'height': 630}, device_scale_factor=1, bypass_csp=True)
            await ctx.add_init_script("try{localStorage.setItem('kel.lang','%s')}catch(e){}" % lang)
            pg = await ctx.new_page()
            await pg.goto(BASE + path, wait_until='networkidle')
            await pg.add_style_tag(content=HIDE)
            await pg.wait_for_timeout(11000)  # nascimento do buraco + nome decodificado
            out = ROOT / 'public' / 'og' / f'og-{lang}.jpg'
            await pg.screenshot(path=str(out), type='jpeg', quality=86)
            print(out.relative_to(ROOT), round(out.stat().st_size / 1024, 1), 'KB')
            await ctx.close()
        await b.close()

asyncio.run(main())
