#!/usr/bin/env python3
"""Gera o recorte da IBM Plex Sans JP usado na versão /ja/.

Só entram os caracteres japoneses que aparecem no código (src/) mais kana, pontuação
CJK e formas de largura total completas. Resultado: src/fonts/ja/*.woff2 + chars.txt
(lista conferida pelo verify-dist: build falha se surgir caractere fora do recorte).

Uso:  python3 scripts/subset-ja.py            (baixa a fonte com `npm pack`, sem rodar scripts)
      python3 scripts/subset-ja.py <pasta>    (pasta com IBMPlexSansJP-Regular/SemiBold.woff2)
Requer: pip install fonttools brotli
"""
import pathlib, re, subprocess, sys, tarfile, tempfile
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'fonts' / 'ja'
VERSION = '3.0.0'
WEIGHTS = {'Regular': 400, 'SemiBold': 600}

def is_cjk(c: str) -> bool:
    o = ord(c)
    return o >= 0x2E80 or 0x3000 <= o <= 0x30FF or 0xFF00 <= o <= 0xFFEF

def used_chars() -> set[str]:
    chars: set[str] = set()
    for p in (ROOT / 'src').rglob('*'):
        if p.suffix in {'.ts', '.astro', '.md'}:
            chars.update(c for c in p.read_text(encoding='utf8') if is_cjk(c))
    chars.update(chr(o) for o in range(0x3000, 0x3040))  # pontuação CJK
    chars.update(chr(o) for o in range(0x3040, 0x3100))  # hiragana + katakana
    chars.update(chr(o) for o in range(0xFF01, 0xFF5F))  # ASCII de largura total
    return chars

def source_dir() -> pathlib.Path:
    if len(sys.argv) > 1:
        return pathlib.Path(sys.argv[1])
    tmp = pathlib.Path(tempfile.mkdtemp())
    # npm pack só baixa o tarball: não executa o postinstall (telemetria) do pacote
    subprocess.run(['npm', 'pack', f'@ibm/plex-sans-jp@{VERSION}', '--silent'], cwd=tmp, check=True)
    tgz = next(tmp.glob('*.tgz'))
    with tarfile.open(tgz) as t:
        t.extractall(tmp, filter='data')
    return tmp / 'package' / 'fonts' / 'complete' / 'woff2' / 'hinted'

def main() -> None:
    src = source_dir()
    chars = used_chars()
    text = ''.join(sorted(chars))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, weight in WEIGHTS.items():
        opts = subset.Options()
        opts.flavor = 'woff2'
        # features padrão: com '*' entram milhares de glifos alternativos (4x o tamanho)
        opts.name_IDs = ['*']
        opts.notdef_outline = True
        font = subset.load_font(str(src / f'IBMPlexSansJP-{name}.woff2'), opts)
        sub = subset.Subsetter(opts)
        sub.populate(text=text)
        sub.subset(font)
        dest = OUT / f'plex-sans-jp-{weight}.woff2'
        subset.save_font(font, str(dest), opts)
        print(f'{dest.relative_to(ROOT)}  {dest.stat().st_size / 1024:.1f} KB')
    (OUT / 'chars.txt').write_text(text, encoding='utf8')
    print(f'{len(chars)} caracteres no recorte')

if __name__ == '__main__':
    main()
