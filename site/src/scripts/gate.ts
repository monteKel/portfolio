// Tela de idioma da primeira visita. Só aparece quando o /lang-gate.js (no <head>, antes de
// pintar) marcou html.lang-ask. Escolher o idioma desta página: a tela desliga e a página
// começa. Escolher o outro: vai para ele, que já abre direto (a escolha fica salva).
const KEY = 'kel.lang';

function save(lang: string) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* sem armazenamento: o lang-gate.js nem mostraria a tela */
  }
}

export function languageGate(): Promise<void> {
  const root = document.documentElement;
  const gate = document.querySelector<HTMLElement>('[data-gate]');
  if (!gate || !root.classList.contains('lang-ask')) {
    gate?.remove();
    return Promise.resolve();
  }

  const current = root.lang.slice(0, 2);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opts = [...gate.querySelectorAll<HTMLAnchorElement>('[data-lang-pick]')];
  // o resto da página fica fora do alcance do teclado e do leitor de tela enquanto isso
  const rest = [...document.body.children].filter((el): el is HTMLElement => el !== gate && el instanceof HTMLElement);
  rest.forEach((el) => (el.inert = true));

  // sugestão: o primeiro idioma do navegador que o site tem já vem selecionado
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const offered = opts.map((a) => a.dataset['langPick']);
  const wanted = langs.map((l) => l.slice(0, 2).toLowerCase()).find((l) => offered.includes(l)) ?? 'en';
  const suggested = opts.find((a) => a.dataset['langPick'] === wanted) ?? opts[0];
  setTimeout(() => suggested?.focus({ preventScroll: true }), reduced ? 0 : 750);

  return new Promise((resolve) => {
    let closing = false;
    const close = (pick: string, href: string) => {
      if (closing) return;
      closing = true;
      save(pick);
      gate.classList.add('is-closing');
      const done = () => {
        if (pick !== current) {
          window.location.assign(href);
          return;
        }
        root.classList.remove('lang-ask');
        rest.forEach((el) => (el.inert = false));
        gate.remove();
        resolve();
      };
      if (reduced) done();
      else setTimeout(done, 560);
    };

    for (const a of opts) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        close(a.dataset['langPick'] ?? current, a.href);
      });
    }

    gate.addEventListener('keydown', (e) => {
      const i = opts.indexOf(document.activeElement as HTMLAnchorElement);
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        opts[(Math.max(i, 0) + step + opts.length) % opts.length]?.focus();
      } else if (e.key === 'Tab') {
        // foco preso nas opções
        e.preventDefault();
        opts[(Math.max(i, 0) + (e.shiftKey ? -1 : 1) + opts.length) % opts.length]?.focus();
      } else if (e.key === 'Escape') {
        close(current, window.location.href);
      }
    });
  });
}
