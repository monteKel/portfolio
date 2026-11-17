// Terminal da seção "play". Entrada do visitante nunca vira HTML: só textContent.
import { mountMaxCut, type GameText } from './maxcut';
import { mountKMeans } from './games/kmeans';
import { mountDescent } from './games/descent';
import { revealEmail } from './email';

import type { Lang } from './games/kit';

const T = {
  en: {
    welcome: 'type help to see the commands.',
    help: [
      'help        this list',
      'whoami      who is this',
      'projects    list projects',
      'research    what I research',
      'contact     how to reach me',
      'games       list the games',
      'play        Max-Cut, a graph puzzle (5 levels)',
      'kmeans      k-means clustering (3 levels)',
      'descent     gradient descent (3 levels)',
      'date        current date and time',
      'clear       clear the screen',
    ],
    whoami: 'kelve cartaxo. researcher and cs student at UFC, Brazil. machine learning research at NEMO, heading into generative AI. goal: doing research in Japan.',
    research: 'machine learning for combinatorial problems on graphs, starting with maximum diversity. see block 6.',
    contact: (email: string) => `email: ${email}`,
    notFound: (c: string) => `command not found: ${c}. try help.`,
    sudo: 'kel is not in the sudoers file. this incident will be reported.',
    exit: 'there is no exit past the event horizon.',
    gameOver: (s: string) => `game over. ${s}`,
    games: [
      'play      Max-Cut: split a graph so the most edges cross. beat local search.',
      'kmeans    k-means: place centroids so k-means finds the best clusters.',
      'descent   gradient descent: tune learning rate and momentum to reach the global minimum.',
    ],
    game: {
      title: 'Max-Cut',
      help: 'Split the nodes into two groups, ( ) and [ ], so that as many edges as possible connect different groups. Click a node (or press 1-9) to switch its group. Bright edges are cut. s runs the algorithm from your current split, r shuffles, n next level, q quits.',
      level: (n: number, total: number) => `level ${n}/${total}.`,
      score: (c: number, t: number, b: number) => `cut ${c} of ${t} edges. best possible: ${b}.`,
      winSelf: (m: number) => `optimal cut, found by you in ${m} moves.`,
      solverFound: (f: number, to: number, k: number) =>
        `local search took your cut from ${f} to ${to} in ${k} flips and reached the optimum. the next level is harder for it.`,
      solverStuck: (f: number, to: number, k: number, b: number) =>
        `local search took your cut from ${f} to ${to} in ${k} flips, then got stuck: no single flip helps, but ${b} exists. beat it.`,
      solverNoMove: (c: number, b: number) =>
        c === b
          ? `nothing to improve: ${c} is already the optimum.`
          : `local search can't move from ${c}: no single flip helps, but ${b} exists. that's a local optimum.`,
      allDone: 'that was the last level.',
      shuffle: 'shuffle',
      solve: 'run algorithm',
      next: 'next level',
      quit: 'quit',
      node: (n: number, g: string) => `node ${n}, group ${g}. press to switch.`,
    } satisfies GameText,
  },
  pt: {
    welcome: 'digite help para ver os comandos.',
    help: [
      'help        esta lista',
      'whoami      quem é',
      'projects    lista os projetos',
      'research    o que eu pesquiso',
      'contact     como falar comigo',
      'games       lista os jogos',
      'play        Max-Cut, quebra-cabeça de grafo (5 níveis)',
      'kmeans      agrupamento k-means (3 níveis)',
      'descent     descida de gradiente (3 níveis)',
      'date        data e hora',
      'clear       limpa a tela',
    ],
    whoami: 'kelve cartaxo. pesquisador e estudante de computação na UFC. pesquisa em machine learning no NEMO, rumo à IA generativa. objetivo: fazer pesquisa no Japão.',
    research: 'machine learning para problemas combinatórios em grafos, começando pela diversidade máxima. veja o bloco 6.',
    contact: (email: string) => `email: ${email}`,
    notFound: (c: string) => `comando não encontrado: ${c}. tente help.`,
    sudo: 'kel não está no arquivo sudoers. este incidente será reportado.',
    exit: 'não existe saída depois do horizonte de eventos.',
    gameOver: (s: string) => `fim de jogo. ${s}`,
    games: [
      'play      Max-Cut: divida o grafo para o máximo de arestas cruzar. ganhe da busca local.',
      'kmeans    k-means: posicione os centróides para o k-means achar os melhores grupos.',
      'descent   descida de gradiente: ajuste learning rate e momentum até o mínimo global.',
    ],
    game: {
      title: 'Max-Cut',
      help: 'Divida os nós em dois grupos, ( ) e [ ], para que o máximo de arestas ligue grupos diferentes. Clique num nó (ou aperte 1-9) para trocar o grupo dele. Arestas claras estão cortadas. s roda o algoritmo a partir da sua divisão, r embaralha, n próximo nível, q sai.',
      level: (n: number, total: number) => `nível ${n}/${total}.`,
      score: (c: number, t: number, b: number) => `corte ${c} de ${t} arestas. melhor possível: ${b}.`,
      winSelf: (m: number) => `corte ótimo, achado por você em ${m} jogadas.`,
      solverFound: (f: number, to: number, k: number) =>
        `a busca local levou seu corte de ${f} para ${to} em ${k} trocas e chegou no ótimo. o próximo nível é mais difícil para ela.`,
      solverStuck: (f: number, to: number, k: number, b: number) =>
        `a busca local levou seu corte de ${f} para ${to} em ${k} trocas e travou: nenhuma troca sozinha melhora, mas existe ${b}. ganhe dela.`,
      solverNoMove: (c: number, b: number) =>
        c === b
          ? `nada a melhorar: ${c} já é o ótimo.`
          : `a busca local não sai do ${c}: nenhuma troca sozinha melhora, mas existe ${b}. isso é um ótimo local.`,
      allDone: 'esse era o último nível.',
      shuffle: 'embaralhar',
      solve: 'rodar algoritmo',
      next: 'próximo nível',
      quit: 'sair',
      node: (n: number, g: string) => `nó ${n}, grupo ${g}. aperte para trocar.`,
    } satisfies GameText,
  },
  ja: {
    welcome: 'help と入力すると、コマンド一覧を表示します。',
    help: [
      'help        この一覧',
      'whoami      自己紹介',
      'projects    プロジェクト一覧',
      'research    研究テーマ',
      'contact     連絡先',
      'games       ゲーム一覧',
      'play        Max-Cut、グラフのパズル（全5レベル）',
      'kmeans      k-means クラスタリング（全3レベル）',
      'descent     勾配降下法（全3レベル）',
      'date        現在の日時',
      'clear       画面をクリア',
    ],
    whoami: 'kelve cartaxo。研究者／ブラジル・UFCのCS学生。NEMOで機械学習を研究しながら、生成AIの分野を目指しています。目標は日本で研究すること。',
    research: 'グラフ上の組合せ最適化問題への機械学習。まずは最大多様性問題から。詳しくはブロック6へ。',
    contact: (email: string) => `メール: ${email}`,
    notFound: (c: string) => `コマンドが見つかりません: ${c}。help を試してください。`,
    sudo: 'kel は sudoers ファイル内にありません。この事象は報告されます。',
    exit: '事象の地平線の向こうに出口はありません。',
    gameOver: (s: string) => `ゲーム終了。${s}`,
    games: [
      'play      Max-Cut：グループをまたぐ辺が最大になるようにグラフを分割。局所探索に勝とう。',
      'kmeans    k-means：k-means が最良のクラスタを見つけられるように重心を置く。',
      'descent   勾配降下法：学習率とモメンタムを調整して大域的最小値へ。',
    ],
    game: {
      title: 'Max-Cut',
      help: 'ノードを ( ) と [ ] の2グループに分け、違うグループどうしをつなぐ辺をできるだけ多くしてください。ノードをクリック（または 1-9 キー）でグループが切り替わります。明るい辺がカットされた辺です。s で今の分割からアルゴリズムを実行、r でシャッフル、n で次のレベル、q で終了。',
      level: (n: number, total: number) => `レベル ${n}/${total}。`,
      score: (c: number, t: number, b: number) => `カット ${c}/${t} 辺。最適値: ${b}。`,
      winSelf: (m: number) => `最適なカット。あなたが ${m} 手で見つけました。`,
      solverFound: (f: number, to: number, k: number) =>
        `局所探索が ${k} 回の反転であなたのカットを ${f} から ${to} に改善し、最適値に到達しました。次のレベルはアルゴリズムにとってさらに難しくなります。`,
      solverStuck: (f: number, to: number, k: number, b: number) =>
        `局所探索は ${k} 回の反転で ${f} から ${to} まで改善しましたが、そこで止まりました。どのノードを1つ反転しても改善しませんが、${b} のカットが存在します。アルゴリズムに勝ってください。`,
      solverNoMove: (c: number, b: number) =>
        c === b
          ? `改善の余地なし：${c} はすでに最適値です。`
          : `局所探索は ${c} から動けません。どのノードを1つ反転しても改善しませんが、${b} のカットが存在します。これが局所最適解です。`,
      allDone: 'これが最後のレベルでした。',
      shuffle: 'シャッフル',
      solve: 'アルゴリズム実行',
      next: '次のレベル',
      quit: '終了',
      node: (n: number, g: string) => `ノード ${n}、グループ ${g}。押すと切り替わります。`,
    } satisfies GameText,
  },
};

export function mountTerminal(root: HTMLElement, lang: Lang, projectNames: string[]) {
  const t = T[lang];
  const out = root.querySelector<HTMLElement>('[data-term-out]')!;
  const form = root.querySelector<HTMLFormElement>('[data-term-form]')!;
  const input = root.querySelector<HTMLInputElement>('[data-term-input]')!;
  const prompt = form.querySelector('label')?.textContent ?? '$';

  const history: string[] = [];
  let hIdx = 0;

  const print = (text: string, cls = '') => {
    const line = document.createElement('div');
    line.className = `term__row ${cls}`.trim();
    line.textContent = text;
    out.append(line);
    // limite de linhas: quem colar mil comandos não incha a página
    const rows = out.querySelectorAll(':scope > .term__row');
    for (let i = 0; i < rows.length - 300; i++) rows[i]!.remove();
    out.scrollTop = out.scrollHeight;
  };

  const commands: Record<string, () => void> = {
    help: () => t.help.forEach((l) => print(l)),
    whoami: () => print(t.whoami),
    projects: () => projectNames.forEach((n, i) => print(`${String(i + 1).padStart(2, '0')}  ${n}`)),
    ls: () => commands.projects!(),
    research: () => print(t.research),
    contact: () => print(t.contact(revealEmail())),
    date: () => print(new Date().toString()),
    clear: () => out.replaceChildren(),
    sudo: () => print(t.sudo, 'term__row--err'),
    exit: () => print(t.exit),
    games: () => t.games.forEach((l) => print(l)),
    play: () => launch((done) => mountMaxCut(out, t.game, done)),
    kmeans: () => launch((done) => mountKMeans(out, lang, done)),
    descent: () => launch((done) => mountDescent(out, lang, done)),
  };
  commands['maxcut'] = commands.play!;
  commands['jogar'] = commands.play!;
  commands['jogos'] = commands.games!;
  commands['gd'] = commands.descent!;

  function launch(start: (done: (summary: string) => void) => void) {
    form.hidden = true;
    start((summary) => {
      print(t.gameOver(summary));
      form.hidden = false;
      input.focus({ preventScroll: true });
    });
    out.scrollTop = out.scrollHeight;
  }

  const exec = (raw: string) => {
    history.push(raw);
    hIdx = history.length;
    print(`${prompt} ${raw}`, 'term__row--echo');
    const name = raw.split(/\s+/)[0]!.toLowerCase();
    const run = Object.prototype.hasOwnProperty.call(commands, name) ? commands[name] : undefined;
    if (run) run();
    else print(t.notFound(name.slice(0, 24)), 'term__row--err');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim().slice(0, 80);
    input.value = '';
    if (raw) exec(raw);
  });

  // atalhos clicáveis embaixo do terminal (celular e quem não quer digitar)
  root.querySelectorAll<HTMLButtonElement>('[data-term-cmd]').forEach((b) =>
    b.addEventListener('click', () => {
      if (form.hidden) return; // jogo aberto
      exec(b.dataset['termCmd']!);
    }),
  );

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      hIdx = Math.max(0, hIdx - 1);
      input.value = history[hIdx] ?? '';
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] ?? '';
      e.preventDefault();
    } else if (e.key === 'Tab') {
      const v = input.value.trim().toLowerCase();
      const hit = Object.keys(commands).find((c) => v && c.startsWith(v));
      if (hit) {
        input.value = hit;
        e.preventDefault();
      }
    }
  });

  print(t.welcome, 'term__row--dim');
}
