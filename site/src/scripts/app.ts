// Orquestra a página: scroll suave, buraco negro, queda + chegada dos painéis,
// hover, demo de pesquisa ao vivo, terminal, barra de status e contato.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { mountBlackHole, type BlackHole } from './blackhole/host';
import { buildTrace, buildGrids, paintGrids, type Grids } from './mdp';
import { mountTerminal } from './terminal';
import { mountDetective } from './detective';
import { revealEmail } from './email';
import { initInteractions } from './interact';
import type { Lang } from './games/kit';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

/** Liga tudo. Chamada depois da tela de idioma (ou na hora, se ela não aparecer). */
export function start(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const code = document.documentElement.lang.slice(0, 2);
  const lang: Lang = code === 'pt' || code === 'ja' ? code : 'en';
  const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [
    ...root.querySelectorAll<T>(sel),
  ];
  const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  // o ScrambleText do GSAP escreve via innerHTML: nada de < > & no conjunto (e texto com eles não embaralha)
  const SCRAMBLE = '01/\\|#@%*+=-_:~';
  const htmlSafe = (s: string) => !/[<>&]/.test(s);

  document.documentElement.classList.add('js');

  // ---------- trava depois da chegada ----------
  // Depois que a queda termina, subir para no topo dos painéis. Só volta para a animação
  // se você já estiver parado ali e fizer um NOVO movimento para cima.
  let lockOn = false;
  let edgeArmed = false;
  let edgeTimer = 0;
  let lastInput = 0;
  const lockEdge = () => (stagePin ? stagePin.end : 0);
  const atEdge = (y: number) => y <= lockEdge() + 2;
  function armWhenStill() {
    // arma a destrava quando o gesto termina parado na borda
    clearTimeout(edgeTimer);
    edgeTimer = window.setTimeout(() => {
      if (lockOn && atEdge(lenis ? lenis.scroll : window.scrollY)) edgeArmed = true;
    }, 280);
  }
  /** decide um movimento para cima; true = deixa passar, false = bloqueia */
  function lockAllowsUp(y: number, newGesture: boolean): boolean {
    if (!lockOn || !atEdge(y)) return true;
    if (edgeArmed && newGesture) {
      lockOn = false;
      edgeArmed = false;
      return true;
    }
    armWhenStill();
    return false;
  }

  // ---------- scroll suave ----------
  let lenis: Lenis | null = null;
  if (!reduced) {
    lenis = new Lenis({
      lerp: 0.1,
      autoRaf: false,
      virtualScroll: (data) => {
        if (!lockOn || !lenis || data.deltaY >= 0) return true;
        const now = performance.now();
        const newGesture = now - lastInput > 280;
        lastInput = now;
        if (!lockAllowsUp(lenis.scroll, newGesture)) {
          if (data.event.cancelable) data.event.preventDefault();
          return false;
        }
        if (!lockOn) return true;
        // ainda acima da borda: o alvo nunca passa dela
        const room = lockEdge() - lenis.targetScroll;
        if (data.deltaY < room) {
          data.deltaY = room;
          armWhenStill();
        }
        return true;
      },
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const stage = $('[data-stage]');
  const arrive = $('[data-arrive]');
  let stagePin: ScrollTrigger | null = null;

  function scrollToY(y: number) {
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  // avisada a cada navegação explícita (aba, tecla, link); a barra de status preenche depois
  let onNavigate: (id: string) => void = () => {};

  function goTo(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    onNavigate(id);
    if (id === 'home') {
      lockOn = false; // pedido explícito de voltar ao topo
      scrollToY(0);
    }
    else if (stagePin && arrive?.contains(target)) {
      // painéis da chegada: vai até o fim da queda (tudo já em escala 1) e depois até o painel
      scrollToY(stagePin.end + Math.max(0, target.offsetTop - 72));
    } else {
      // posição absoluta medida agora (o Lenis pode estar com a posição antiga, ex.: depois do salto
      // nativo de um link /#bloco)
      scrollToY(Math.max(0, window.scrollY + target.getBoundingClientRect().top - 48));
    }
    if (target.tabIndex < 0) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    if (id === 'contact') {
      const show = $('[data-email-show]');
      if (show && !show.hidden) setTimeout(() => show.classList.add('is-pulsing'), 1200);
    }
  }

  $$<HTMLAnchorElement>('a[href^="#"]:not([data-mailto])').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      goTo(id);
    });
  });

  // trava também no teclado e no toque
  window.addEventListener('keydown', (e) => {
    if (!lockOn) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, .mc')) return;
    if (e.key === 'Home') {
      lockOn = false;
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      const now = performance.now();
      const newGesture = !e.repeat && now - lastInput > 280;
      lastInput = now;
      if (!lockAllowsUp(lenis ? lenis.scroll : window.scrollY, newGesture)) e.preventDefault();
    }
  });
  let touchY = 0;
  let touchNew = false;
  window.addEventListener('touchstart', (e) => {
    touchY = e.touches[0]?.clientY ?? 0;
    touchNew = true;
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!lockOn) return;
    const dy = (e.touches[0]?.clientY ?? 0) - touchY; // > 0: dedo descendo = página subindo
    if (dy > 4) {
      if (!lockAllowsUp(window.scrollY, touchNew) && e.cancelable) e.preventDefault();
      touchNew = false;
    }
  }, { passive: false });
  window.addEventListener('touchend', () => lockOn && atEdge(window.scrollY) && armWhenStill(), { passive: true });
  // inércia do toque (ou qualquer outro caminho) passando da borda: volta para ela
  window.addEventListener('scroll', () => {
    if (lockOn && window.scrollY < lockEdge() - 2) {
      if (lenis) lenis.scrollTo(lockEdge(), { immediate: true, force: true });
      else window.scrollTo(0, lockEdge());
      armWhenStill();
    }
  }, { passive: true });

  // ---------- hover: caracteres embaralham e assentam ----------
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent ?? '';
    if (reduced || !htmlSafe(text)) return;
    const run = () =>
      gsap.to(el, { duration: 0.45, overwrite: true, scrambleText: { text, chars: SCRAMBLE, speed: 1.2 } });
    el.addEventListener('pointerenter', run);
    el.addEventListener('focus', run);
  });

  // ---------- hero: entrada ----------
  const heroName = $('[data-hero-name]');
  if (heroName && !reduced) {
    const text = heroName.textContent ?? '';
    gsap.fromTo(
      heroName,
      { scrambleText: { text: text.replace(/\S/g, '#'), chars: SCRAMBLE } },
      { duration: 1.8, delay: 0.4, scrambleText: { text, chars: SCRAMBLE, revealDelay: 0.4, speed: 0.5 } },
    );
    gsap.from('[data-hero-fade]', { opacity: 0, y: 12, duration: 0.8, delay: 1.6, stagger: 0.15, ease: 'power2.out' });
  }

  // ---------- buraco negro + queda + chegada ----------
  let bhApi: BlackHole | null = null;
  const canvas = $<HTMLCanvasElement>('#bh');
  const bhWrap = $('.bh');

  interface Layout {
    base: number;
    cx0: number;
    cy0: number;
    bgZoom: number;
    bgCx: number;
    bgCy: number;
  }

  // progresso da queda (0 a 1) controla tudo:
  // 0.00-0.62 cai no buraco | 0.62-0.78 escurece por dentro | 0.48-1.00 painéis crescem do centro
  // 1.00 chegou: buraco pequeno aparece no canto (só depois da animação inicial) e começa a emitir ondas
  let L: Layout | null = null;
  let orbit = false;
  function applyFall(p: number) {
    if (arrive) {
      const k = clamp01((p - 0.48) / 0.52);
      // escala exponencial: parece aproximação, não "inflar"
      arrive.style.transform = k >= 1 ? 'none' : `scale(${Math.pow(0.04, 1 - k).toFixed(4)})`;
      // chegou: libera o corte da primeira tela (CSS) para o resto da coluna aparecer ao rolar
      arrive.style.clipPath = k >= 1 ? 'none' : '';
      arrive.style.opacity = String(smooth(k * 1.6));
    }
    if (!bhApi || !L || !bhWrap) return;
    if (p < 0.995) {
      const q = clamp01(p / 0.62);
      const k = smooth(q);
      bhApi.setParams({
        zoom: L.base * (1 + 3.6 * q * q),
        cx: L.cx0 * (1 - k),
        cy: L.cy0 * (1 - k),
        fps: 30,
        mode: 0,
      });
      bhWrap.style.transition = 'none';
      bhWrap.style.opacity = String(p < 0.62 ? 1 : Math.max(0, 1 - (p - 0.62) / 0.16));
      orbit = false;
    } else if (!orbit) {
      orbit = true;
      lockOn = true;
      edgeArmed = false;
      landing();
      bhApi.setParams({ zoom: L.bgZoom, cx: L.bgCx, cy: L.bgCy, fps: 24, mode: 1 });
      bhWrap.style.transition = 'opacity 0.9s ease';
      bhWrap.style.opacity = '0.72';
    }
  }

  // revela um painel: título decodifica e o conteúdo entra em sequência.
  // Roda toda vez que o painel volta à tela, descendo ou subindo (fromTo: nunca trava no meio).
  const PANE_PARTS = '.about__line, .facts div, .now li, .tags--big li, .email, .links li, .card__line, .tags li';
  function revealPane(pane: Element) {
    if (reduced) return;
    const title = pane.querySelector<HTMLElement>('.pane__name');
    const text = title ? (title.dataset['text'] ?? title.textContent ?? '') : '';
    if (title && htmlSafe(text)) {
      title.dataset['text'] = text;
      gsap.fromTo(
        title,
        { scrambleText: { text: ' ', chars: SCRAMBLE } },
        { duration: 0.6, overwrite: true, scrambleText: { text, chars: SCRAMBLE } },
      );
    }
    const parts = pane.querySelectorAll(PANE_PARTS);
    if (parts.length)
      gsap.fromTo(
        parts,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', overwrite: true, clearProps: 'transform' },
      );
  }
  function landing() {
    $$('[data-arrive] .pane').forEach((p, i) => setTimeout(() => revealPane(p), i * 90));
  }

  if (stage && !reduced) {
    // um único ScrollTrigger: fixa o palco, anima o texto e conduz a queda (dois triggers no
    // mesmo elemento fixado calculam o início em lugares diferentes)
    const introTl = gsap
      .timeline({ paused: true })
      .to('[data-hero-name]', { '--wdth': 75, letterSpacing: '-0.04em', ease: 'none', duration: 0.5 }, 0)
      .to('.hero__intro', { opacity: 0, yPercent: -8, ease: 'power1.in', duration: 0.4 }, 0.06)
      // invisível não pode bloquear cliques; o h1 segue acessível (visibility: hidden o tiraria do leitor de tela)
      .set('.hero__intro', { pointerEvents: 'none' }, 0.3)
      .set({}, {}, 1);
    stagePin = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 1.7)}`,
      pin: true,
      scrub: true,
      animation: introTl,
      invalidateOnRefresh: true,
      onUpdate: (s) => applyFall(s.progress),
    });
  }

  if (canvas && bhWrap) {
    mountBlackHole(canvas, reduced)
      .then((bh) => {
        bhApi = bh;
        if (document.documentElement.classList.contains('is-still')) bh.pause(true); // pausa salva
        const layout = (): Layout => {
          // tela larga ou celular deitado: buraco à direita do texto (não escondido atrás do nome)
          const wide = window.innerWidth >= 900 || window.innerWidth > window.innerHeight * 1.25;
          const half = bh.halfWidth();
          return {
            base: wide ? 1 : 0.62,
            cx0: wide ? half * 0.4 : 0,
            cy0: wide ? -0.04 : -0.34,
            // canto de baixo à direita: fica no vão abaixo dos painéis, sem ser coberto
            bgZoom: wide ? 0.4 : 0.32,
            bgCx: wide ? half * 0.8 : half * 0.5,
            bgCy: wide ? 0.66 : 0.74,
          };
        };
        L = layout();
        window.addEventListener('resize', () => {
          L = layout();
          if (orbit) bh.setParams({ zoom: L.bgZoom, cx: L.bgCx, cy: L.bgCy });
        });
        if (reduced) {
          bh.setParams({ zoom: L.base, cx: L.cx0, cy: L.cy0, mode: 0 });
          ScrollTrigger.create({
            start: 0,
            end: () => window.innerHeight,
            onUpdate: (s) => (bhWrap.style.opacity = String(1 - 0.75 * s.progress)),
          });
          return;
        }
        applyFall(stagePin?.progress ?? 0);
      })
      .catch(() => {
        bhWrap.hidden = true; // sem canvas: a página segue funcionando
      });
  }

  // ---------- projetos: hover revela a arte ----------
  $$('[data-card]').forEach((card) => {
    const art = $('.card__art', card);
    if (!art || reduced) return;
    card.addEventListener('pointerenter', () =>
      gsap.fromTo(
        art,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'steps(24)', overwrite: true },
      ),
    );
  });

  // ---------- animações de scroll ----------
  if (!reduced) {
    // cards "impressos" linha a linha sempre que entram na tela (descendo ou subindo)
    const printIn = (batch: Element[]) =>
      gsap.fromTo(
        batch,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'steps(14)', stagger: 0.09, overwrite: true },
      );
    const hide = (batch: Element[]) => gsap.set(batch, { clipPath: 'inset(0 0 100% 0)' });
    hide($$('[data-card]'));
    ScrollTrigger.batch('[data-card]', {
      start: 'top 92%',
      end: 'bottom 8%',
      onEnter: printIn,
      onEnterBack: printIn,
      onLeave: hide,
      onLeaveBack: hide,
    });

    // arte dos cards com paralaxe leve
    $$('.card__art').forEach((art) =>
      gsap.fromTo(
        art,
        { backgroundPositionY: 0, y: 10 },
        { y: -10, ease: 'none', scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: true } },
      ),
    );

    // painéis: decodificam toda vez que entram na tela, descendo ou subindo
    $$('.pane').forEach((pane) => {
      const inArrive = !!arrive?.contains(pane);
      ScrollTrigger.create({
        trigger: pane,
        start: 'top 88%',
        end: 'bottom 12%',
        ...(inArrive && stage ? { pinnedContainer: stage } : {}),
        onEnter: () => (!inArrive || orbit) && revealPane(pane),
        onEnterBack: () => (!inArrive || orbit) && revealPane(pane),
      });
    });

    // "KEL" do rodapé se monta a partir de caracteres soltos conforme você chega no fim
    const mark = $('.footer__mark');
    if (mark) {
      const final = mark.textContent ?? '';
      const seeds = [...final].map(() => Math.random());
      const noise = '.:-=+*#%@';
      const render = (p: number) => {
        mark.textContent = [...final]
          .map((ch, i) => (ch === ' ' || ch === '\n' || p >= seeds[i]! ? ch : noise[Math.floor(Math.random() * noise.length)]!))
          .join('');
      };
      render(0);
      ScrollTrigger.create({
        trigger: mark,
        start: 'top bottom',
        end: 'bottom bottom-=40',
        scrub: true,
        onUpdate: (s) => render(s.progress * 1.05),
        onLeave: () => (mark.textContent = final),
      });
    }

    initInteractions(() => bhApi);
  }

  // ---------- lab: diversidade máxima rodando em loop ----------
  const research = $('[data-mdp]');
  if (research) {
    const { pts, states } = buildTrace();
    const mdpCanvas = $<HTMLCanvasElement>('[data-mdp-canvas]', research)!;
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    const style: Record<keyof Grids, [string, number]> = {
      edges: [v('--dim'), 400],
      pts: [v('--ash'), 400],
      sel: ['#ffffff', 700],
      out: [v('--red'), 700],
      in: [v('--amber'), 700],
    };
    let current: Grids | null = null;
    const paint = () => current && paintGrids(mdpCanvas, current, style);
    // redesenha quando o painel muda de tamanho e quando a fonte chega
    new ResizeObserver(paint).observe(mdpCanvas);
    void document.fonts.ready.then(paint);
    const fEl = $('[data-mdp-f]', research)!;
    const stepEl = $('[data-mdp-step]', research)!;
    const barEl = $('[data-mdp-bar]', research)!;
    const show = (i: number) => {
      const s = states[i]!;
      current = buildGrids(pts, s);
      paint();
      fEl.textContent = s.f.toFixed(3);
      stepEl.textContent = `${i}/${states.length - 1}`;
      const filled = Math.round((i / (states.length - 1)) * 16);
      barEl.textContent = `[${'#'.repeat(filled)}${'.'.repeat(16 - filled)}]`;
    };
    if (reduced) show(states.length - 1);
    else {
      let i = 0;
      let timer = 0;
      let visible = false;
      const still = () => document.documentElement.classList.contains('is-still');
      const tick = () => {
        if (still()) return;
        show(i);
        const last = i === states.length - 1;
        i = last ? 0 : i + 1;
        timer = window.setTimeout(tick, last ? 2600 : 750);
      };
      // só roda quando está na tela e sem pausa
      new IntersectionObserver(([e]) => {
        clearTimeout(timer);
        visible = !!e?.isIntersecting;
        if (visible) tick();
      }).observe(research);
      document.addEventListener('kel:motion', () => {
        clearTimeout(timer);
        if (visible) tick();
      });
      show(0);
    }
  }

  // ---------- terminal ----------
  const term = $('[data-term]');
  if (term) {
    const names = $$('.card__title').map((n) => n.textContent ?? '');
    mountTerminal(term, lang, names);
  }

  // ---------- detetive (caso do dia) ----------
  const det = $('[data-det]');
  if (det) mountDetective(det, lang);

  // ---------- contato ----------
  const showBtn = $<HTMLButtonElement>('[data-email-show]');
  const emailText = $('[data-email-text]');
  const copyBtn = $<HTMLButtonElement>('[data-email-copy]');
  if (showBtn && emailText && copyBtn) {
    showBtn.addEventListener('click', () => {
      const email = revealEmail();
      if (reduced) emailText.textContent = email;
      else gsap.to(emailText, { duration: 0.8, scrambleText: { text: email, chars: SCRAMBLE } });
      showBtn.hidden = true;
      copyBtn.hidden = false;
    });
    copyBtn.addEventListener('click', async () => {
      const label = copyBtn.textContent;
      try {
        await navigator.clipboard.writeText(revealEmail());
        copyBtn.textContent = copyBtn.dataset['copied'] ?? 'copied';
      } catch {
        copyBtn.textContent = copyBtn.dataset['failed'] ?? 'copy blocked';
      }
      setTimeout(() => (copyBtn.textContent = label), 2000);
    });
  }

  // "fale comigo": abre o app de email já endereçado. Sem app de email configurado o navegador
  // não faz nada; se a página não perder o foco, cai no bloco de contato com o endereço à mostra.
  $$<HTMLAnchorElement>('[data-mailto]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      let left = false;
      const away = () => (left = true);
      window.addEventListener('blur', away, { once: true });
      document.addEventListener('visibilitychange', away, { once: true });
      const subject = a.dataset['subject'];
      window.location.href =
        `mailto:${revealEmail()}` + (subject ? `?subject=${encodeURIComponent(subject)}` : '');
      setTimeout(() => {
        window.removeEventListener('blur', away);
        document.removeEventListener('visibilitychange', away);
        if (left) return;
        if (showBtn && !showBtn.hidden) showBtn.click();
        goTo('contact');
      }, 1500);
    });
  });

  // ---------- barra de status ----------
  // abas = blocos, com o mesmo número do título de cada um (0 = topo)
  const tabs = $$<HTMLAnchorElement>('[data-tab]');
  const tabIds = tabs.map((t) => t.dataset['tab']!);
  const sectionName = $('[data-status-section]');
  let currentTab = '';
  let lastTabPulse = 0;
  const setTab = (id: string, fromScroll: boolean) => {
    if (id === currentTab) return;
    // bloco novo pela rolagem = onda saindo do buraco (no máx. uma a cada 2,5 s; passar o mouse não gera onda)
    const now = performance.now();
    if (id !== 'home' && fromScroll && now - lastTabPulse > 2500) {
      bhApi?.pulse(1.0);
      lastTabPulse = now;
    }
    currentTab = id;
    tabs.forEach((t) => {
      const on = t.dataset['tab'] === id;
      t.classList.toggle('is-active', on);
      if (on) {
        // barra com abas roláveis (texto ampliado): mantém a ativa à vista, sem mexer na página
        const bar = t.closest('ul');
        if (bar && bar.scrollWidth > bar.clientWidth) {
          const li = t.parentElement!;
          bar.scrollLeft = li.offsetLeft - (bar.clientWidth - li.offsetWidth) / 2;
        }
        t.setAttribute('aria-current', 'true');
        if (sectionName) sectionName.textContent = t.textContent ?? id;
      } else t.removeAttribute('aria-current');
    });
  };
  setTab('home', false);

  const zones = tabIds
    .filter((id) => id !== 'home')
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((z): z is { id: string; el: HTMLElement } => !!z.el);
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let px = -1;
  let py = -1;

  // bloco escolhido por aba/tecla: fica ativo até sair da linha de leitura ou o mouse entrar em outro
  let forcedTab: string | null = null;
  let forcedReached = false;
  onNavigate = (id) => {
    forcedTab = id === 'home' ? null : id;
    forcedReached = false;
    setTab(id, false);
  };
  const crossesLine = (el: HTMLElement | null, line: number) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top <= line && r.bottom > line;
  };

  // bloco ativo, como o painel ativo do tmux. Mexendo o mouse: o bloco sob ele.
  // Rolando: o escolhido na aba/tecla; senão o que cruza a linha de leitura (30% da tela),
  // o mais perto do mouse quando há dois lado a lado.
  function pickTab(fromPointer: boolean): string | null {
    if (stagePin && window.scrollY < stagePin.end - 2) return 'home';
    if (fromPointer) {
      for (const z of zones) {
        const r = z.el.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          if (z.id !== forcedTab) forcedTab = null;
          return z.id;
        }
      }
      return null;
    }
    const line = window.innerHeight * 0.3;
    if (forcedTab) {
      if (crossesLine(document.getElementById(forcedTab), line)) {
        forcedReached = true;
        return forcedTab;
      }
      if (!forcedReached) return forcedTab; // ainda rolando até ele
      forcedTab = null;
    }
    let best: string | null = null;
    let bestDx = Infinity;
    for (const z of zones) {
      if (!crossesLine(z.el, line)) continue;
      const r = z.el.getBoundingClientRect();
      const dx = px < 0 ? 0 : Math.max(0, r.left - px, px - r.right);
      if (dx < bestDx) {
        best = z.id;
        bestDx = dx;
      }
    }
    if (!best && currentTab === 'home') return zones[0]?.id ?? null; // já chegou, mas está num vão
    return best; // null = vão entre fileiras: mantém a aba atual
  }
  // rolagem do usuário interrompe a viagem até o bloco escolhido
  const dropTravel = () => {
    if (forcedTab && !forcedReached) forcedTab = null;
  };
  window.addEventListener('wheel', dropTravel, { passive: true });
  window.addEventListener('touchstart', dropTravel, { passive: true });
  const updateTab = (fromScroll: boolean) => {
    const id = pickTab(!fromScroll);
    if (id) setTab(id, fromScroll);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: () => updateTab(true) });

  if (hoverable) {
    let queued = false;
    document.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        px = e.clientX;
        py = e.clientY;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          updateTab(false);
        });
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => {
      px = -1;
      py = -1;
    });
  }

  const pctEl = $('[data-status-pct]');
  if (pctEl) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => (pctEl.textContent = `${String(Math.round(s.progress * 100)).padStart(3, ' ')}%`),
    });
  }

  // teclas 0-7 levam ao bloco de mesmo número (fora de campos de texto e dos jogos)
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, .mc, .term')) return;
    if (!/^[0-9]$/.test(e.key)) return;
    const id = tabIds[Number(e.key)];
    if (id) goTo(id);
  });

  // ---------- pausar animações (WCAG 2.2.2: movimento automático precisa poder parar) ----------
  const motionBtn = $<HTMLButtonElement>('[data-motion]');
  if (motionBtn && !reduced) {
    const setStill = (on: boolean) => {
      document.documentElement.classList.toggle('is-still', on);
      motionBtn.setAttribute('aria-pressed', String(on));
      motionBtn.textContent = (on ? motionBtn.dataset['play'] : motionBtn.dataset['pause']) ?? '';
      bhApi?.pause(on);
      document.dispatchEvent(new Event('kel:motion'));
      try {
        if (on) localStorage.setItem('kel.still', '1');
        else localStorage.removeItem('kel.still');
      } catch {
        /* sem armazenamento: vale só nesta visita */
      }
    };
    motionBtn.addEventListener('click', () => setStill(motionBtn.getAttribute('aria-pressed') !== 'true'));
    let saved = false;
    try {
      saved = localStorage.getItem('kel.still') === '1';
    } catch {
      /* nada */
    }
    if (saved) setStill(true);
  }

  // link direto para um bloco (ex.: /#contact): o salto nativo do navegador não sabe da queda
  // fixada, então quem cuida é o goTo, depois que o layout assentou. Só ids das abas.
  const deep = window.location.hash.slice(1);
  if (deep && deep !== 'home' && tabIds.includes(deep)) {
    const jump = () =>
      requestAnimationFrame(() => {
        // o salto nativo pode ter acontecido antes do Lenis existir: atualiza o tamanho da página
        // (a queda fixada acrescenta altura) e alinha a posição dele com a real
        lenis?.resize();
        lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
        goTo(deep);
      });
    // espera o load e as fontes (a fonte que chega depois muda a altura dos blocos)
    const loaded = new Promise<void>((ok) =>
      document.readyState === 'complete' ? ok() : window.addEventListener('load', () => ok(), { once: true }),
    );
    void Promise.all([loaded, document.fonts.ready]).then(jump);
  }

  // a tela de idioma pode segurar o início até depois do load
  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else window.addEventListener('load', () => ScrollTrigger.refresh());
}
