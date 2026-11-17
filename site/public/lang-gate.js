// Roda no <head>, antes da primeira pintura (arquivo externo: a CSP proíbe script embutido).
// 1ª visita: marca html.lang-ask e a página mostra a tela de idioma.
// Visitas seguintes: abre direto no idioma escolhido.
(function () {
  var KEY = 'kel.lang';
  var root = document.documentElement;
  var LANGS = ['en', 'pt', 'ja'];
  var code = root.lang.slice(0, 2);
  var current = LANGS.indexOf(code) >= 0 ? code : 'en';
  var store;
  try {
    store = window.localStorage;
    store.setItem(KEY + '.probe', '1');
    store.removeItem(KEY + '.probe');
  } catch (e) {
    return; // sem armazenamento a escolha não ficaria salva: segue sem a tela
  }

  // links marcados (tela de idioma e botão da barra) gravam a escolha antes de navegar
  document.addEventListener(
    'click',
    function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-lang-pick]') : null;
      var pick = el ? el.getAttribute('data-lang-pick') : null;
      if (LANGS.indexOf(pick) < 0) return;
      try {
        store.setItem(KEY, pick);
      } catch (err) {
        /* nada */
      }
    },
    true
  );

  var saved = null;
  try {
    saved = store.getItem(KEY);
  } catch (e) {
    /* nada */
  }
  if (LANGS.indexOf(saved) >= 0) {
    if (saved !== current) {
      var to = root.getAttribute('data-alt-' + saved);
      if (to) {
        root.classList.add('lang-moving');
        window.location.replace(to + window.location.hash);
      }
    }
    return;
  }
  root.classList.add('lang-ask');
})();
