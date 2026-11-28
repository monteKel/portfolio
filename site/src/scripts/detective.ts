// Jogo diário do detetive. Fala com a API da VM (api.kelvecartaxo.dev, liberada na CSP).
// Tudo que vem do servidor ou do visitante entra na página só por textContent.
import type { Lang } from './games/kit';

const API = 'https://api.kelvecartaxo.dev/detetive';
type Label = 'sim' | 'não' | 'irrelevante';

const T = {
  en: {
    loading: 'loading the case...',
    offline: 'the game master is offline right now. try again later.',
    noCase: 'no case today. come back tomorrow.',
    meta: (dia: string) => `case of ${dia}`,
    next: (c: string) => `next case in ${c}`,
    newCase: 'new case is up. loading...',
    nick: 'nickname',
    join: 'start',
    nickHelp: 'nickname: 2 to 20 letters, numbers, space, dot, hyphen or _',
    modeQ: 'question',
    modeT: 'theory',
    qLabel: 'ask (yes/no, in Portuguese)',
    qLabelSame: 'ask (yes or no)',
    tLabel: 'your theory: what happened?',
    send: 'send',
    rank: 'leaderboard',
    back: 'back',
    quit: 'give up',
    quitSure: 'sure? give up',
    queue: (n: number, s: number) => (n > 0 ? `in line: ${n} ahead, ~${s} s` : `the game master is thinking, ~${s} s`),
    count: (p: number, pt: number, t: number, tt: number) => `questions ${p}/${pt}, theories ${t}/${tt}`,
    label: { sim: 'yes', não: 'no', irrelevante: 'irrelevant' } as Record<Label, string>,
    theory: (k: number, n: number, left: number) =>
      `theory: ${k} of ${n} key points. ${left} ${left === 1 ? 'try' : 'tries'} left.`,
    solved: (p: number, t: number) =>
      `solved with ${p} ${p === 1 ? 'question' : 'questions'} and ${t} ${t === 1 ? 'theory' : 'theories'}. you made the leaderboard.`,
    end: { resolvido: 'solved. the full story:', esgotado: 'no theories left. the full story:', desistiu: 'you gave up. the full story:', ontem: "that day's case is over. the full story:" } as Record<string, string>,
    points: 'key points',
    rankEmpty: 'nobody solved it yet today. be the first.',
    rankRow: (i: number, n: string, p: number, t: number, s: number) => `${i}. ${n}  ${p} q, ${t} t, ${mins(s)}`,
    retry: (s: number) => `too many requests. wait ${s} s.`,
    generic: 'something went wrong. try again.',
    failed: 'the game master could not answer now. try again.',
    errors: {
      'esse apelido já está jogando hoje': 'that nickname is already playing today.',
      'espere a resposta anterior': 'wait for the previous answer.',
      'o mestre está cheio de perguntas, tente em instantes': 'the game master is busy. try again in a moment.',
      'acabaram suas perguntas: mande sua teoria': 'no questions left: send your theory.',
      'acabaram suas teorias': 'no theories left.',
      'você já terminou o caso de hoje': "you already finished today's case.",
      'sem caso hoje, volte amanhã': 'no case today. come back tomorrow.',
    } as Record<string, string>,
  },
  pt: {
    loading: 'carregando o caso...',
    offline: 'o mestre está fora do ar agora. tente mais tarde.',
    noCase: 'sem caso hoje. volte amanhã.',
    meta: (dia: string) => `caso de ${dia.split('-').reverse().join('/')}`,
    next: (c: string) => `próximo caso em ${c}`,
    newCase: 'caso novo no ar. carregando...',
    nick: 'apelido',
    join: 'começar',
    nickHelp: 'apelido: 2 a 20 letras, números, espaço, ponto, hífen ou _',
    modeQ: 'pergunta',
    modeT: 'teoria',
    qLabel: 'pergunte (sim ou não)',
    qLabelSame: 'pergunte (sim ou não)',
    tLabel: 'sua teoria: o que aconteceu?',
    send: 'enviar',
    rank: 'ranking',
    back: 'voltar',
    quit: 'desistir',
    quitSure: 'certeza? desistir',
    queue: (n: number, s: number) => (n > 0 ? `na fila: ${n} na frente, ~${s} s` : `o mestre está pensando, ~${s} s`),
    count: (p: number, pt: number, t: number, tt: number) => `perguntas ${p}/${pt}, teorias ${t}/${tt}`,
    label: { sim: 'sim', não: 'não', irrelevante: 'irrelevante' } as Record<Label, string>,
    theory: (k: number, n: number, left: number) =>
      `teoria: ${k} de ${n} pontos essenciais. ${left === 1 ? 'resta 1 tentativa' : `restam ${left} tentativas`}.`,
    solved: (p: number, t: number) =>
      `resolvido com ${p} ${p === 1 ? 'pergunta' : 'perguntas'} e ${t} ${t === 1 ? 'teoria' : 'teorias'}. você entrou no ranking.`,
    end: { resolvido: 'resolvido. a história completa:', esgotado: 'acabaram as teorias. a história completa:', desistiu: 'você desistiu. a história completa:', ontem: 'o caso daquele dia acabou. a história completa:' } as Record<string, string>,
    points: 'pontos essenciais',
    rankEmpty: 'ninguém resolveu ainda hoje. seja o primeiro.',
    rankRow: (i: number, n: string, p: number, t: number, s: number) => `${i}. ${n}  ${p} perg., ${t} teor., ${mins(s)}`,
    retry: (s: number) => `muitos pedidos. espere ${s} s.`,
    generic: 'deu errado. tente de novo.',
    failed: 'o mestre não conseguiu responder agora. tente de novo.',
    errors: {} as Record<string, string>,
  },
  ja: {
    loading: '事件を読み込み中...',
    offline: 'ゲームマスターは現在オフラインです。しばらくしてからお試しください。',
    noCase: '今日の事件はありません。また明日どうぞ。',
    meta: (dia: string) => `${dia} の事件`,
    next: (c: string) => `次の事件まで ${c}`,
    newCase: '新しい事件が公開されました。読み込み中...',
    nick: 'ニックネーム',
    join: 'はじめる',
    nickHelp: 'ニックネーム：2〜20文字（英数字・スペース・ピリオド・ハイフン・_）',
    modeQ: '質問',
    modeT: '推理',
    qLabel: '質問（はい／いいえ、ポルトガル語で）',
    qLabelSame: '質問（はい／いいえ）',
    tLabel: 'あなたの推理：何が起きた？',
    send: '送信',
    rank: 'ランキング',
    back: '戻る',
    quit: 'あきらめる',
    quitSure: '本当に？あきらめる',
    queue: (n: number, s: number) => (n > 0 ? `順番待ち：前に${n}件、約${s}秒` : `ゲームマスターが考えています、約${s}秒`),
    count: (p: number, pt: number, t: number, tt: number) => `質問 ${p}/${pt}、推理 ${t}/${tt}`,
    label: { sim: 'はい', não: 'いいえ', irrelevante: '関係ない' } as Record<Label, string>,
    theory: (k: number, n: number, left: number) => `推理：重要ポイント ${n} 個中 ${k} 個。残り ${left} 回。`,
    solved: (p: number, t: number) => `解決！質問 ${p} 回、推理 ${t} 回。ランキングに入りました。`,
    end: { resolvido: '解決。事件の全容：', esgotado: '推理の回数がなくなりました。事件の全容：', desistiu: 'あきらめました。事件の全容：', ontem: 'この日の事件は終了しました。事件の全容：' } as Record<string, string>,
    points: '重要ポイント',
    rankEmpty: '今日はまだ誰も解決していません。最初の一人になろう。',
    rankRow: (i: number, n: string, p: number, t: number, s: number) => `${i}. ${n}  質問${p}・推理${t}・${mins(s)}`,
    retry: (s: number) => `リクエストが多すぎます。${s}秒お待ちください。`,
    generic: 'エラーが発生しました。もう一度お試しください。',
    failed: 'ゲームマスターが今は答えられませんでした。もう一度お試しください。',
    errors: {
      'esse apelido já está jogando hoje': 'そのニックネームは今日すでに使われています。',
      'espere a resposta anterior': '前の回答をお待ちください。',
      'o mestre está cheio de perguntas, tente em instantes': 'ゲームマスターが混み合っています。少しお待ちください。',
      'acabaram suas perguntas: mande sua teoria': '質問の回数がなくなりました。推理を送ってください。',
      'acabaram suas teorias': '推理の回数がなくなりました。',
      'você já terminou o caso de hoje': '今日の事件はもう終わっています。',
      'sem caso hoje, volte amanhã': '今日の事件はありません。また明日どうぞ。',
    } as Record<string, string>,
  },
};

function mins(s: number): string {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

// ---------- respostas da API (só os campos usados) ----------
type Idioma = 'pt' | 'en' | 'ja';
const HTML_LANG: Record<Idioma, string> = { pt: 'pt-BR', en: 'en', ja: 'ja' };
interface Hoje { dia: string; idioma: Idioma; proximo_em_s: number; titulo: string; situacao: string; max_perguntas: number; max_teorias: number; total_essenciais: number }
interface Pedido {
  id: string;
  estado: 'fila' | 'rodando' | 'pronto' | 'erro';
  a_frente?: number;
  espera_s?: number;
  consultar_em_s?: number;
  resultado?: Resultado;
}
type Resultado =
  | { tipo: 'pergunta'; pergunta: string; resposta: Label }
  | { tipo: 'teoria'; resolvido: boolean; essenciais_cobertos: number; total_essenciais: number; restam_teorias: number };
interface Sessao {
  apelido: string;
  dia: string;
  idioma: Idioma;
  estado: 'jogando' | 'resolvido' | 'desistiu' | 'esgotado';
  perguntas: { pergunta: string; resposta: Label }[];
  teorias: { texto: string; resolvido: boolean; essenciais_cobertos: number }[];
  total_essenciais: number;
  restam_perguntas: number;
  restam_teorias: number;
  pedido: string | null;
  revelacao?: { historia: string; fatos: { texto: string; essencial: boolean; acertou: boolean }[] } | null;
}

class ApiError extends Error {
  constructor(readonly status: number, readonly msg: string, readonly retry: number) {
    super(msg);
  }
}

async function call<R>(method: 'GET' | 'POST', path: string, token?: string, body?: unknown): Promise<R> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
  } catch {
    throw new ApiError(0, '', 0);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* corpo vazio ou não-JSON */
  }
  if (!res.ok) {
    const msg = typeof (data as { erro?: unknown })?.erro === 'string' ? (data as { erro: string }).erro : '';
    throw new ApiError(res.status, msg, Number(res.headers.get('Retry-After')) || 0);
  }
  return data as R;
}

// token da sessão: só neste navegador, um por dia
const store = {
  get(dia: string): string | null {
    try {
      return localStorage.getItem(`kel.det.${dia}`);
    } catch {
      return null;
    }
  },
  set(dia: string, token: string): void {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith('kel.det.')) localStorage.removeItem(k);
      }
      localStorage.setItem(`kel.det.${dia}`, token);
    } catch {
      /* modo privado: a sessão vive só nesta aba */
    }
  },
  drop(dia: string): void {
    try {
      localStorage.removeItem(`kel.det.${dia}`);
    } catch {
      /* nada */
    }
  },
};

const NICK = /^[\p{L}\p{N}][\p{L}\p{N}_ .-]{1,19}$/u;
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function mountDetective(root: HTMLElement, lang: Lang): void {
  const t = T[lang];
  const q = <E extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<E>(sel)!;
  const el = {
    meta: q('[data-det-meta]'),
    title: q('[data-det-title]'),
    situation: q('[data-det-situation]'),
    log: q('[data-det-log]'),
    status: q('[data-det-status]'),
    join: q<HTMLFormElement>('[data-det-join]'),
    nick: q<HTMLInputElement>('[data-det-nick]'),
    play: q<HTMLFormElement>('[data-det-play]'),
    modes: [...root.querySelectorAll<HTMLButtonElement>('[data-det-mode]')],
    qLabel: q('[data-det-q-label]'),
    qInput: q<HTMLInputElement>('[data-det-q]'),
    tLabel: q('[data-det-t-label]'),
    tInput: q<HTMLTextAreaElement>('[data-det-t]'),
    send: q<HTMLButtonElement>('[data-det-send]'),
    tools: q('[data-det-tools]'),
    count: q('[data-det-count]'),
    rankBtn: q<HTMLButtonElement>('[data-det-rank-btn]'),
    quit: q<HTMLButtonElement>('[data-det-quit]'),
    reveal: q('[data-det-reveal]'),
    rank: q('[data-det-rank]'),
    intro: q('[data-det-intro]'),
    start: q<HTMLButtonElement>('[data-det-start]'),
    rulesBtn: q<HTMLButtonElement>('[data-det-rules-btn]'),
    langNote: root.closest('.pane')?.querySelector<HTMLElement>('[data-det-langnote]') ?? null,
    clock: q('[data-det-clock]'),
  };
  q('[data-det-nick-label]').textContent = `${t.nick}>`;
  q('[data-det-join-btn]').textContent = t.join;
  el.nick.title = t.nickHelp;
  el.modes[0]!.textContent = t.modeQ;
  el.modes[1]!.textContent = t.modeT;
  el.tLabel.textContent = `${t.tLabel}>`;
  el.send.textContent = t.send;
  el.rankBtn.textContent = t.rank;
  el.quit.textContent = t.quit;

  let hoje: Hoje | null = null;
  let token: string | null = null;
  let sessao: Sessao | null = null;
  let mode: 'q' | 't' = 'q';
  let caseLang: Idioma = 'pt';
  // o caso pode vir em outro idioma (sem tradução para o dia): marca lang certo e ajusta textos
  const setCaseLang = (idioma: Idioma) => {
    caseLang = idioma;
    const h = HTML_LANG[idioma];
    for (const n of [el.title, el.situation, el.qInput, el.tInput, el.log, el.reveal]) n.lang = h;
    el.qLabel.textContent = `${idioma === lang ? t.qLabelSame : t.qLabel}>`;
    if (el.langNote) el.langNote.hidden = idioma === lang;
  };
  let busy = false;

  const say = (msg: string, kind: '' | 'err' = '') => {
    el.status.textContent = msg;
    el.status.classList.toggle('det__status--err', kind === 'err');
  };
  const errText = (e: unknown): string => {
    if (!(e instanceof ApiError) || e.status === 0) return t.offline;
    if (e.status === 429) return t.retry(e.retry || 10);
    if (lang === 'pt' && e.msg) return e.msg;
    return t.errors[e.msg] ?? t.generic;
  };

  const row = (cls: string, text: string, labelText?: string, label?: Label) => {
    const r = document.createElement('div');
    r.className = `det__row ${cls}`;
    const s = document.createElement('span');
    s.textContent = text;
    r.append(s);
    if (label && labelText) {
      const a = document.createElement('span');
      a.className = `det__ans det__ans--${label === 'não' ? 'nao' : label}`;
      a.textContent = labelText;
      r.append(' ', a);
    }
    el.log.append(r);
    el.log.hidden = false;
    el.log.scrollTop = el.log.scrollHeight;
  };
  const ansText = (l: Label) => (caseLang === lang ? t.label[l] : `${l} · ${t.label[l]}`);
  const logQuestion = (p: string, l: Label) => row('det__row--q', `> ${p}`, ansText(l), l);
  const logTheory = (texto: string, k: number, n: number) => {
    row('det__row--t', `# ${texto}`);
    row('det__row--dim', `  ${k}/${n}`);
  };

  const setMode = (m: 'q' | 't') => {
    mode = m;
    el.modes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset['detMode'] === m)));
    el.qInput.hidden = el.qLabel.hidden = m !== 'q';
    el.tInput.hidden = el.tLabel.hidden = m !== 't';
    (m === 'q' ? el.qInput : el.tInput).focus();
  };
  el.modes.forEach((b) => b.addEventListener('click', () => setMode(b.dataset['detMode'] === 't' ? 't' : 'q')));
  el.tInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) el.play.requestSubmit();
  });

  const setBusy = (b: boolean) => {
    busy = b;
    el.send.disabled = b;
    el.quit.disabled = b;
  };

  const renderCount = () => {
    if (!sessao || !hoje) return;
    const p = hoje.max_perguntas - sessao.restam_perguntas;
    const tt = hoje.max_teorias - sessao.restam_teorias;
    el.count.textContent = t.count(p, hoje.max_perguntas, tt, hoje.max_teorias);
  };

  const renderReveal = (s: Sessao) => {
    el.reveal.replaceChildren();
    const r = s.revelacao;
    if (!r) return;
    const head = document.createElement('p');
    head.className = 'det__end';
    head.textContent = s.dia !== hoje?.dia ? t.end['ontem']! : t.end[s.estado] ?? '';
    const story = document.createElement('p');
    story.className = 'det__story';
    story.lang = HTML_LANG[caseLang];
    story.textContent = r.historia;
    const sub = document.createElement('p');
    sub.className = 'muted small';
    sub.textContent = t.points;
    const list = document.createElement('ul');
    list.className = 'det__facts';
    list.lang = HTML_LANG[caseLang];
    for (const f of r.fatos.filter((x) => x.essencial)) {
      const li = document.createElement('li');
      li.className = f.acertou ? 'is-hit' : '';
      li.textContent = `${f.acertou ? '[x]' : '[ ]'} ${f.texto}`;
      list.append(li);
    }
    el.reveal.append(head, story, sub, list);
    el.reveal.hidden = false;
  };

  const renderSession = (s: Sessao) => {
    sessao = s;
    setCaseLang(s.idioma ?? 'pt');
    el.log.replaceChildren();
    for (const p of s.perguntas) logQuestion(p.pergunta, p.resposta);
    for (const th of s.teorias) logTheory(th.texto, th.essenciais_cobertos, s.total_essenciais);
    const playing = s.estado === 'jogando' && s.dia === hoje?.dia;
    showRules(false);
    el.join.hidden = true;
    el.play.hidden = !playing;
    el.tools.hidden = false;
    el.quit.hidden = !playing;
    renderCount();
    if (!playing) renderReveal(s);
  };

  // tela de regras: aparece antes de jogar; no jogo, abre e fecha pelo botão "regras"
  const showRules = (show: boolean) => {
    el.intro.hidden = !show;
    el.rulesBtn.setAttribute('aria-expanded', String(show));
  };
  const showJoin = () => {
    showRules(false);
    el.join.hidden = false;
    el.play.hidden = true;
    el.tools.hidden = true;
    el.nick.focus();
  };
  el.start.addEventListener('click', () => {
    if (!hoje) return;
    el.start.hidden = true;
    showJoin();
  });
  el.rulesBtn.addEventListener('click', () => showRules(el.intro.hidden !== false));

  const refresh = async () => {
    if (!token) return;
    renderSession(await call<Sessao>('GET', '/sessao', token));
  };

  // acompanha um pedido na fila até a resposta sair
  const follow = async (id: string) => {
    setBusy(true);
    try {
      for (;;) {
        const p = await call<Pedido>('GET', `/pedido/${encodeURIComponent(id)}`, token!);
        if (p.estado === 'pronto' && p.resultado) {
          say('');
          const r = p.resultado;
          if (r.tipo === 'pergunta') {
            logQuestion(r.pergunta, r.resposta);
            if (sessao) sessao.restam_perguntas = Math.max(sessao.restam_perguntas - 1, 0);
            renderCount();
          } else {
            await refresh();
            say(r.resolvido ? t.solved(hoje!.max_perguntas - sessao!.restam_perguntas, hoje!.max_teorias - r.restam_teorias)
              : t.theory(r.essenciais_cobertos, r.total_essenciais, r.restam_teorias));
          }
          return;
        }
        if (p.estado === 'erro') {
          say(t.failed, 'err');
          return;
        }
        say(t.queue(p.a_frente ?? 0, p.espera_s ?? 0));
        await wait(Math.min(Math.max(p.consultar_em_s ?? 1, 1), 5) * 1000);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) say(t.failed, 'err');
      else say(errText(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  el.join.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !hoje) return;
    const nick = el.nick.value.normalize('NFC').replace(/ +/g, ' ').trim();
    if (!NICK.test(nick)) {
      say(t.nickHelp, 'err');
      return;
    }
    setBusy(true);
    try {
      const r = await call<{ token: string; dia: string }>('POST', '/sessao', undefined, { apelido: nick, idioma: hoje.idioma ?? 'pt' });
      token = r.token;
      store.set(r.dia, r.token);
      say('');
      await refresh();
      el.qInput.focus();
    } catch (err) {
      say(errText(err), 'err');
    } finally {
      setBusy(false);
    }
  });

  el.play.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !token) return;
    const input = mode === 'q' ? el.qInput : el.tInput;
    const texto = input.value.trim();
    if (!texto) return;
    setBusy(true);
    try {
      const p = await call<Pedido>('POST', mode === 'q' ? '/pergunta' : '/teoria', token, { texto });
      input.value = '';
      setBusy(false);
      await follow(p.id);
      input.focus();
    } catch (err) {
      say(errText(err), 'err');
      setBusy(false);
    }
  });

  let quitArmed = false;
  el.quit.addEventListener('click', async () => {
    if (busy || !token) return;
    if (!quitArmed) {
      quitArmed = true;
      el.quit.textContent = t.quitSure;
      window.setTimeout(() => {
        quitArmed = false;
        el.quit.textContent = t.quit;
      }, 4000);
      return;
    }
    setBusy(true);
    try {
      renderSession(await call<Sessao>('POST', '/desistir', token));
      say('');
    } catch (err) {
      say(errText(err), 'err');
    } finally {
      setBusy(false);
    }
  });

  el.rankBtn.addEventListener('click', async () => {
    if (!el.rank.hidden) {
      el.rank.hidden = true;
      el.rankBtn.textContent = t.rank;
      return;
    }
    try {
      const r = await call<{ jogadores: { apelido: string; perguntas: number; teorias: number; segundos: number }[] }>('GET', '/ranking');
      el.rank.replaceChildren();
      const list = document.createElement('ol');
      list.className = 'det__ranklist';
      if (!r.jogadores.length) {
        const li = document.createElement('li');
        li.textContent = t.rankEmpty;
        list.append(li);
      }
      r.jogadores.forEach((j, i) => {
        const li = document.createElement('li');
        li.textContent = t.rankRow(i + 1, j.apelido, j.perguntas, j.teorias, j.segundos);
        list.append(li);
      });
      el.rank.append(list);
      el.rank.hidden = false;
      el.rankBtn.textContent = t.back;
    } catch (err) {
      say(errText(err), 'err');
    }
  });

  // contador até o caso novo (meia-noite de Brasília, contada pelo servidor; aqui só desconta o tempo)
  let relogio = 0;
  const hms = (ms: number) => {
    const s = Math.max(Math.ceil(ms / 1000), 0);
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  };
  // reserva, se a API não mandar o tempo: meia-noite de Brasília pelo relógio do visitante
  const faltaLocal = (): number => {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date());
    const n = (k: string) => Number(partes.find((x) => x.type === k)?.value ?? 0);
    return 86400 - ((n('hour') % 24) * 3600 + n('minute') * 60 + n('second'));
  };
  const startClock = (segundos: number) => {
    window.clearInterval(relogio);
    const fim = performance.now() + segundos * 1000;
    const tick = () => {
      const falta = fim - performance.now();
      if (falta > 0) {
        el.clock.textContent = t.next(hms(falta));
        return;
      }
      window.clearInterval(relogio);
      el.clock.textContent = t.newCase;
      // o servidor confere a virada a cada 30 s e ainda aquece o caso: espera um pouco antes de pedir
      window.setTimeout(() => void restart(), 45_000);
    };
    tick();
    relogio = window.setInterval(tick, 1000);
  };
  const restart = async () => {
    hoje = null;
    token = null;
    sessao = null;
    el.log.replaceChildren();
    for (const n of [el.log, el.reveal, el.rank, el.join, el.play, el.tools]) n.hidden = true;
    el.start.hidden = false;
    el.start.disabled = true;
    showRules(true);
    await boot();
  };

  // carrega o caso só quando o painel chega perto da tela: visita que não rola até aqui não chama a VM
  const boot = async () => {
    say(t.loading);
    try {
      hoje = await call<Hoje>('GET', `/hoje?idioma=${lang}`);
    } catch (e) {
      say(e instanceof ApiError && e.status === 503 ? t.noCase : errText(e), e instanceof ApiError && e.status === 503 ? '' : 'err');
      return;
    }
    setCaseLang(hoje.idioma ?? 'pt');
    el.meta.textContent = t.meta(hoje.dia);
    startClock(Number.isFinite(hoje.proximo_em_s) ? hoje.proximo_em_s : faltaLocal());
    el.title.textContent = hoje.titulo;
    el.situation.textContent = hoje.situacao;
    say('');
    token = store.get(hoje.dia);
    el.start.disabled = false;
    if (!token) return;
    try {
      await refresh();
      el.start.hidden = true;
      if (sessao?.pedido) void follow(sessao.pedido);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        store.drop(hoje.dia);
        token = null;
      } else say(errText(e), 'err');
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((x) => x.isIntersecting)) {
        io.disconnect();
        void boot();
      }
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(root);
}
