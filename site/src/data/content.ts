// Todo o texto do site, em EN, PT e JA. Curto: portfólio, não tutorial.
// Regra: nada inventado. Dado que falta fica como TODO(kel) visível.

export type Lang = 'en' | 'pt' | 'ja';

/** idiomas do site: caminho, código para hreflang/lang e nomes (tela de escolha e barra) */
export const LANGS: {
  code: Lang;
  path: string;
  hreflang: string;
  ogLocale: string;
  label: string;
  name: string;
  /** "escolha o idioma" no próprio idioma */
  pick: string;
  /** rótulo acessível do link para este idioma */
  aria: string;
}[] = [
  { code: 'en', path: '/', hreflang: 'en', ogLocale: 'en_US', label: 'EN', name: 'English', pick: 'choose a language', aria: 'Read in English' },
  { code: 'pt', path: '/pt/', hreflang: 'pt-BR', ogLocale: 'pt_BR', label: 'PT', name: 'Português', pick: 'escolha o idioma', aria: 'Ler em português' },
  { code: 'ja', path: '/ja/', hreflang: 'ja', ogLocale: 'ja_JP', label: 'JA', name: '日本語', pick: '言語を選択', aria: '日本語で読む' },
];
export type Link = { label: string; href: string | null; text?: string };

export interface Project {
  slug: string;
  name: string;
  status: string;
  year: string;
  tags: string[];
  /** uma linha */
  line: string;
  /** métrica que falta, se houver */
  todo?: string;
  /** ASCII preview, desenhado à mão (sem copiar ninguém) */
  art: string;
  links: Link[];
}

export interface Dict {
  meta: { title: string; description: string };
  skip: string;
  tabs: { id: string; label: string }[];
  hero: { name: string; role: string; lines: string[]; hint: string; cta: string };
  about: { title: string; lines: string[]; facts: [string, string][]; /** texto alternativo da foto */ portrait: string };
  now: { title: string; items: { tag: string; text: string }[] };
  stack: { title: string; items: string[] };
  contact: {
    title: string;
    text: string;
    show: string;
    copy: string;
    copied: string;
    copyFailed: string;
    /** assunto do email aberto pelo botão "fale comigo" */
    subject: string;
    links: Link[];
  };
  projects: { title: string; items: Project[]; code: string; todoLink: string };
  research: { title: string; caption: string; note: string; objective: string; step: string };
  play: { title: string; text: string; quick: { cmd: string; label: string }[] };
  footer: { built: string; privacy: string; rights: string };
  /** nome dos idiomas na barra (aria do grupo) */
  langsLabel: string;
  /** botão de pausar as animações automáticas (WCAG 2.2.2) */
  motion: { pause: string; play: string; aria: string };
}

const ART = {
  assistant: String.raw`
+-- russas.ufc.br --------------+
|                               |
|  > when does enrollment open? |
|                               |
|  * retrieving [#####...] 3 doc|
|  * grounding answer           |
|                               |
|  < According to the campus    |
|    calendar page, ...         |
|                    [sources]  |
+-------------------------------+`,
  f1: String.raw`
        +---+
        | 1 |
  +---+ |   |
  | 2 | |   | +---+
  |   | |   | | 3 |
--+---+-+---+-+---+--
 grid --> features --> model
                        |
        XGBoost <-------+
        LSTM    <-------+`,
  mdp: String.raw`
  o     @         o      o
     o       o        @
  @      o      o
       o    o       o     @
   o        @    o
        o       o     o
  @         o        @   o
  max  sum d(i,j)  over |S| = m`,
  server: String.raw`
+-- nemo ------------------------+
| $ docker compose ps            |
| NAME       STATUS              |
| postgres   running (healthy)   |
| project-a  running             |
| project-b  running             |
|                                |
| mode: [beginner]  advanced     |
| ufw: active   ssh: keys only   |
+--------------------------------+`,
  turing: String.raw`
  ... +---+---+---+---+---+---+ ...
      | 1 | 0 | 1 | 1 | _ | _ |
      +---+---+---+---+---+---+
                ^
               q2
  d(q2, 1) = (q2, 1, R)
  d(q2, _) = (q3, _, L)`,
  compiler: String.raw`
  x = a + 2 * b ;
  |
  v lexer
  ID  =  ID  +  NUM  *  ID  ;
  |
  v parser
        =
       / \
      x   +
         / \
        a   *
           / \
          2   b`,
  steam: String.raw`
  +-- achievements ---------------+
  | ################....   41/52  |
  |                               |
  | [x] finish chapter 1          |
  | [x] find every relic          |
  | [ ] no-damage boss run        |
  | [ ] collect 500 coins         |
  +-------------------------------+`,
};

const en: Dict = {
  meta: {
    title: 'Kelve Cartaxo, machine learning',
    description:
      'Kelve Cartaxo, computer science student at UFC (Brazil) building machine learning systems and moving toward generative AI.',
  },
  skip: 'Skip to content',
  // mesma numeração dos blocos (0 = topo, como as janelas do tmux)
  tabs: [
    { id: 'home', label: 'home' },
    { id: 'about', label: 'about' },
    { id: 'now', label: 'now' },
    { id: 'stack', label: 'stack' },
    { id: 'contact', label: 'contact' },
    { id: 'projects', label: 'projects' },
    { id: 'research', label: 'diversity' },
    { id: 'games', label: 'games' },
  ],
  hero: {
    name: 'Kelve Cartaxo',
    role: 'CS student building machine learning systems. Heading into generative AI.',
    lines: ['Federal University of Ceará, Brazil, class of 2027', 'open to remote work'],
    hint: 'scroll to fall in',
    cta: 'get in touch',
  },
  about: {
    title: 'about',
    lines: [
      'Researcher at NEMO, the machine learning and optimization lab at UFC, Brazil.',
      'Computer science, graduating 2027.',
      'Python-first: I train models, explain them and ship them behind an API.',
      'Next goal: doing research in Japan.',
    ],
    facts: [
      ['based in', 'Russas, Brazil (UTC−3)'],
      ['focus', 'ML engineering, generative AI'],
      ['status', 'open to remote work'],
      ['english', 'C2 (EF SET 72/100)'],
      ['japanese', 'basic, N5 level (studying)'],
    ],
    portrait: 'Kelve Cartaxo',
  },
  now: {
    title: 'now',
    items: [
      { tag: 'thesis', text: 'F1 podium prediction, XGBoost vs LSTM' },
      { tag: 'research', text: 'ML for the maximum diversity problem' },
      { tag: 'building', text: 'NEMO lab server distro' },
      { tag: 'learning', text: 'MLOps, PostgreSQL' },
    ],
  },
  stack: {
    title: 'stack',
    items: ['Python', 'PyTorch', 'XGBoost', 'SHAP', 'Hugging Face', 'YOLOv8', 'ONNX', 'FastAPI', 'Docker', 'SQLite', 'Git', 'LaTeX'],
  },
  contact: {
    title: 'contact',
    text: 'Email is the fastest way to reach me.',
    show: 'show email',
    copy: 'copy',
    copied: 'copied',
    copyFailed: 'copy blocked, select the text',
    subject: 'Saw your portfolio',
    links: [
      { label: 'github', href: 'https://github.com/monteKel' },
      { label: 'linkedin', href: 'https://www.linkedin.com/in/kelvemcartaxo' },
      // TODO(kel): versões em inglês e japonês
      { label: 'cv (pt-br)', href: '/cv/kelve-cartaxo-cv-pt-br.pdf', text: 'kelve-cartaxo-cv-pt-br.pdf' },
    ],
  },
  projects: {
    title: 'projects',
    code: 'code',
    todoLink: 'TODO(kel) link',
    items: [
      {
        slug: 'campus-assistant',
        name: 'UFC Russas campus assistant',
        status: 'deployed',
        year: '2026',
        tags: ['RAG', 'FastAPI', 'ChromaDB', 'Gemini'],
        line: 'Chatbot that answers from the campus website, not from model memory. Runs on 2 GB, no GPU.',
        todo: 'TODO(kel): metric',
        art: ART.assistant,
        links: [{ label: 'code', href: null }],
      },
      {
        slug: 'f1-podium',
        name: 'F1 podium prediction',
        status: 'thesis',
        year: '2026',
        tags: ['XGBoost', 'LSTM', 'SHAP'],
        line: '252 races, 2014 to 2025. Can ML beat the starting grid? The gain shows up in ranking.',
        todo: 'TODO(kel): metric vs grid',
        art: ART.f1,
        links: [{ label: 'code', href: null }],
      },
      {
        slug: 'max-diversity',
        name: 'Maximum diversity, with ML',
        status: 'research',
        year: '2026',
        tags: ['graphs', 'heuristics', 'Python'],
        line: 'Picking the items that are farthest apart from each other. Live demo in the lab below.',
        art: ART.mdp,
        links: [],
      },
      {
        slug: 'nemo-server',
        name: 'NEMO lab server',
        status: 'prototype',
        year: '2026',
        tags: ['Ubuntu', 'Docker', 'PostgreSQL'],
        line: 'A server distro so lab members can host anything without knowing Linux.',
        art: ART.server,
        links: [],
      },
      {
        slug: 'turing-machine',
        name: 'Turing machine simulator',
        status: 'coursework',
        year: '2026',
        tags: ['TODO(kel): stack'],
        line: 'Theory of Computation project, presented in a seminar. Pair project.',
        art: ART.turing,
        links: [{ label: 'code', href: null }],
      },
      {
        slug: 'compiler',
        name: 'Compiler',
        status: 'coursework',
        year: '2026',
        tags: ['TODO(kel): stack'],
        line: 'Compilers course project. Pair project.',
        art: ART.compiler,
        links: [{ label: 'code', href: null }],
      },
      {
        slug: 'platinum-helper',
        name: 'Steam platinum helper',
        status: 'planned',
        year: 'next',
        tags: ['FastAPI', 'Docker', 'PostgreSQL'],
        line: 'Next build: a helper for finishing every achievement in a game.',
        art: ART.steam,
        links: [],
      },
    ],
  },
  research: {
    title: 'max diversity, live',
    caption: 'Pick 8 of 40 points as far apart as possible. Local search, running now.',
    note: 'toy instance, not research results',
    objective: 'total distance',
    step: 'step',
  },
  play: {
    title: 'games',
    text: 'A graph puzzle to play against an algorithm, and the classic snake.',
    quick: [
      { cmd: 'play', label: 'Max-Cut' },
      { cmd: 'snake', label: 'snake' },
      { cmd: 'help', label: 'help' },
    ],
  },
  footer: {
    built: 'Built with Astro and GSAP.',
    privacy: 'No cookies, no trackers.',
    rights: '© 2026 Kelve Cartaxo',
  },
  langsLabel: 'Language',
  motion: { pause: 'pause', play: 'play', aria: 'Pause animations' },
};

const pt: Dict = {
  meta: {
    title: 'Kelve Cartaxo, machine learning',
    description:
      'Kelve Cartaxo, estudante de ciência da computação na UFC construindo sistemas de machine learning e indo em direção à IA generativa.',
  },
  skip: 'Pular para o conteúdo',
  tabs: [
    { id: 'home', label: 'início' },
    { id: 'about', label: 'sobre' },
    { id: 'now', label: 'agora' },
    { id: 'stack', label: 'stack' },
    { id: 'contact', label: 'contato' },
    { id: 'projects', label: 'projetos' },
    { id: 'research', label: 'diversidade' },
    { id: 'games', label: 'jogos' },
  ],
  hero: {
    name: 'Kelve Cartaxo',
    role: 'Estudante de computação construindo sistemas de machine learning. Rumo à IA generativa.',
    lines: ['Universidade Federal do Ceará, turma de 2027', 'aberto a trabalho remoto'],
    hint: 'role para cair',
    cta: 'fale comigo',
  },
  about: {
    title: 'sobre',
    lines: [
      'Pesquisador no NEMO, laboratório de machine learning e otimização da UFC.',
      'Ciência da computação, formatura em 2027.',
      'Python primeiro: treino modelos, explico e coloco atrás de uma API.',
      'Próximo objetivo: fazer pesquisa no Japão.',
    ],
    facts: [
      ['local', 'Russas, Brasil (UTC−3)'],
      ['foco', 'engenharia de ML, IA generativa'],
      ['status', 'aberto a trabalho remoto'],
      ['inglês', 'C2 (EF SET 72/100)'],
      ['japonês', 'básico, nível N5 (estudando)'],
    ],
    portrait: 'Kelve Cartaxo',
  },
  now: {
    title: 'agora',
    items: [
      { tag: 'tcc', text: 'previsão de pódio na F1, XGBoost vs LSTM' },
      { tag: 'pesquisa', text: 'ML para o problema da diversidade máxima' },
      { tag: 'construindo', text: 'distro do servidor do NEMO' },
      { tag: 'estudando', text: 'MLOps, PostgreSQL' },
    ],
  },
  stack: { title: 'stack', items: en.stack.items },
  contact: {
    title: 'contato',
    text: 'Email é o jeito mais rápido de falar comigo.',
    show: 'mostrar email',
    copy: 'copiar',
    copied: 'copiado',
    copyFailed: 'cópia bloqueada, selecione o texto',
    subject: 'Vi seu portfólio',
    links: [
      { label: 'github', href: 'https://github.com/monteKel' },
      { label: 'linkedin', href: 'https://www.linkedin.com/in/kelvemcartaxo' },
      { label: 'currículo (pt-br)', href: '/cv/kelve-cartaxo-cv-pt-br.pdf', text: 'kelve-cartaxo-cv-pt-br.pdf' },
    ],
  },
  projects: {
    title: 'projetos',
    code: 'código',
    todoLink: 'TODO(kel) link',
    items: [
      {
        ...en.projects.items[0]!,
        name: 'Assistente do campus UFC Russas',
        status: 'no ar',
        line: 'Chatbot que responde a partir do site do campus, não da memória do modelo. Roda em 2 GB, sem GPU.',
        todo: 'TODO(kel): métrica',
        links: [{ label: 'código', href: null }],
      },
      {
        ...en.projects.items[1]!,
        name: 'Previsão de pódio na F1',
        status: 'tcc',
        line: '252 corridas, de 2014 a 2025. ML supera o grid de largada? O ganho aparece no ranqueamento.',
        todo: 'TODO(kel): métrica vs grid',
        links: [{ label: 'código', href: null }],
      },
      {
        ...en.projects.items[2]!,
        name: 'Diversidade máxima, com ML',
        status: 'pesquisa',
        tags: ['grafos', 'heurísticas', 'Python'],
        line: 'Escolher os itens mais distantes entre si. Demo ao vivo no lab, logo abaixo.',
      },
      {
        ...en.projects.items[3]!,
        name: 'Servidor do NEMO',
        status: 'protótipo',
        line: 'Uma distro de servidor para os membros do laboratório hospedarem qualquer coisa sem saber Linux.',
      },
      {
        ...en.projects.items[4]!,
        name: 'Simulador de máquina de Turing',
        status: 'disciplina',
        line: 'Projeto de Teoria da Computação, apresentado em seminário. Em dupla.',
        links: [{ label: 'código', href: null }],
      },
      {
        ...en.projects.items[5]!,
        name: 'Compilador',
        status: 'disciplina',
        line: 'Projeto da disciplina de Compiladores. Em dupla.',
        links: [{ label: 'código', href: null }],
      },
      {
        ...en.projects.items[6]!,
        status: 'planejado',
        year: 'próximo',
        line: 'Próximo projeto: um ajudante para fazer todas as conquistas de um jogo.',
      },
    ],
  },
  research: {
    title: 'diversidade máxima, ao vivo',
    caption: 'Escolher 8 de 40 pontos o mais longe possível entre si. Busca local, rodando agora.',
    note: 'instância de brinquedo, não são resultados da pesquisa',
    objective: 'distância total',
    step: 'passo',
  },
  play: {
    title: 'jogos',
    text: 'Um quebra-cabeça de grafos para jogar contra um algoritmo, e a cobrinha clássica.',
    quick: [
      { cmd: 'play', label: 'Max-Cut' },
      { cmd: 'snake', label: 'cobrinha' },
      { cmd: 'help', label: 'help' },
    ],
  },
  footer: {
    built: 'Feito com Astro e GSAP.',
    privacy: 'Sem cookies, sem rastreadores.',
    rights: '© 2026 Kelve Cartaxo',
  },
  langsLabel: 'Idioma',
  motion: { pause: 'pausar', play: 'retomar', aria: 'Pausar animações' },
};

const ja: Dict = {
  meta: {
    title: 'Kelve Cartaxo｜機械学習',
    description:
      'ブラジルのセアラー連邦大学（UFC）でコンピュータサイエンスを学ぶ Kelve Cartaxo のポートフォリオ。機械学習システムを開発し、生成AIの分野を目指しています。',
  },
  skip: '本文へスキップ',
  tabs: [
    { id: 'home', label: 'ホーム' },
    { id: 'about', label: '自己紹介' },
    { id: 'now', label: '現在' },
    { id: 'stack', label: '技術スタック' },
    { id: 'contact', label: '連絡先' },
    { id: 'projects', label: 'プロジェクト' },
    { id: 'research', label: '最大多様性' },
    { id: 'games', label: 'ゲーム' },
  ],
  hero: {
    name: 'Kelve Cartaxo',
    role: '機械学習システムを開発する、コンピュータサイエンス専攻の学生。生成AIの分野を目指しています。',
    lines: ['ブラジル・セアラー連邦大学（UFC）、2027年卒業予定', 'リモートの仕事を募集中'],
    hint: 'スクロールして突入',
    cta: 'お問い合わせ',
  },
  about: {
    title: '自己紹介',
    lines: [
      'ブラジル・UFCの機械学習・最適化研究室 NEMO の研究者。',
      '専攻はコンピュータサイエンス、2027年卒業予定。',
      'Pythonが中心。モデルを学習させ、その判断を説明し、APIとして公開します。',
      '次の目標は、日本で研究することです。',
    ],
    facts: [
      ['拠点', 'ブラジル、Russas（UTC−3）'],
      ['専門', '機械学習エンジニアリング、生成AI'],
      ['状況', 'リモートの仕事を募集中'],
      ['英語', 'C2（EF SET 72/100）'],
      ['日本語', '初級（N5程度・勉強中）'],
    ],
    portrait: 'Kelve Cartaxo',
  },
  now: {
    title: '現在の取り組み',
    items: [
      { tag: '卒業研究', text: 'F1の表彰台予測、XGBoost vs LSTM' },
      { tag: '研究', text: '最大多様性問題への機械学習の応用' },
      { tag: '開発中', text: 'NEMO研究室のサーバー用ディストリビューション' },
      { tag: '学習中', text: 'MLOps、PostgreSQL' },
    ],
  },
  stack: { title: '技術スタック', items: en.stack.items },
  contact: {
    title: '連絡先',
    text: 'メールがいちばん早い連絡手段です。',
    show: 'メールアドレスを表示',
    copy: 'コピー',
    copied: 'コピーしました',
    copyFailed: 'コピーできませんでした。テキストを選択してください',
    subject: 'ポートフォリオを拝見しました',
    links: [
      { label: 'github', href: 'https://github.com/monteKel' },
      { label: 'linkedin', href: 'https://www.linkedin.com/in/kelvemcartaxo' },
      { label: 'CV (pt-br)', href: '/cv/kelve-cartaxo-cv-pt-br.pdf', text: 'kelve-cartaxo-cv-pt-br.pdf' },
    ],
  },
  projects: {
    title: 'プロジェクト',
    code: 'コード',
    todoLink: 'TODO(kel) link',
    items: [
      {
        ...en.projects.items[0]!,
        name: 'UFC Russas キャンパスアシスタント',
        status: '運用中',
        line: 'モデルの記憶ではなく、キャンパスのWebサイトをもとに回答するチャットボット。GPUなし・2 GBの環境で動作。',
        todo: 'TODO(kel): 指標',
        links: [{ label: 'コード', href: null }],
      },
      {
        ...en.projects.items[1]!,
        name: 'F1表彰台予測',
        status: '卒業研究',
        line: '2014〜2025年の252レース。機械学習はスタート順位による予想を超えられるのか。差が出るのはランキングの精度。',
        todo: 'TODO(kel): グリッドとの比較指標',
        links: [{ label: 'コード', href: null }],
      },
      {
        ...en.projects.items[2]!,
        name: '最大多様性問題 × 機械学習',
        status: '研究',
        tags: ['グラフ', 'ヒューリスティクス', 'Python'],
        line: '互いに最も離れた要素の組を選ぶ問題。下のブロック6でライブデモが動いています。',
      },
      {
        ...en.projects.items[3]!,
        name: 'NEMO研究室サーバー',
        status: 'プロトタイプ',
        line: 'Linuxを知らなくても、研究室のメンバーが何でもホストできるサーバー用ディストリビューション。',
      },
      {
        ...en.projects.items[4]!,
        name: 'チューリングマシン・シミュレーター',
        status: '授業課題',
        line: '計算理論の授業プロジェクト。セミナーで発表。ペアで制作。',
        links: [{ label: 'コード', href: null }],
      },
      {
        ...en.projects.items[5]!,
        name: 'コンパイラ',
        status: '授業課題',
        line: 'コンパイラの授業プロジェクト。ペアで制作。',
        links: [{ label: 'コード', href: null }],
      },
      {
        ...en.projects.items[6]!,
        status: '計画中',
        year: '近日',
        line: '次に作るもの：ゲームの実績をすべて解除するための支援ツール。',
      },
    ],
  },
  research: {
    title: '最大多様性（ライブ）',
    caption: '40点から、互いにできるだけ離れた8点を選びます。局所探索がいま動いています。',
    note: 'デモ用の小さな例で、研究結果ではありません',
    objective: '総距離',
    step: 'ステップ',
  },
  play: {
    title: 'ゲーム',
    text: 'アルゴリズムと対戦するグラフパズルと、定番のスネーク。',
    quick: [
      { cmd: 'play', label: 'Max-Cut' },
      { cmd: 'snake', label: 'スネーク' },
      { cmd: 'help', label: 'help' },
    ],
  },
  footer: {
    built: 'Astro と GSAP で制作。',
    privacy: 'Cookie もトラッカーも使っていません。',
    rights: '© 2026 Kelve Cartaxo',
  },
  langsLabel: '言語',
  motion: { pause: '停止', play: '再生', aria: 'アニメーションを停止' },
};

export const content: Record<Lang, Dict> = { en, pt, ja };
