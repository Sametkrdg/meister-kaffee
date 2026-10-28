import { escapeHtml } from '../../lib/validate.js';

/**
 * Panel kabuğu. İçerik sunucuda basılmaz; admin.js açılışta
 * GET /api/admin/content ile doldurur ve PUT ile kaydeder.
 *
 * Böylece panel her zaman KV'deki güncel hali gösterir ve kaydetme
 * sonrası sayfa yenilemeye gerek kalmaz.
 */
import { asset } from '../../lib/assets.js';

export function renderDashboard({ session, assetVersion }) {
  const v = (path) => asset(path, assetVersion);
  const email = escapeHtml(session?.sub || '');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yönetim Paneli — Meister Kaffee-Rösterei</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="${v('/images/favicon.png')}" type="image/png">
  <meta name="theme-color" content="#FAF9F6">
  <meta name="color-scheme" content="light">
  <link rel="stylesheet" href="${v('/assets/admin.css')}">
</head>
<body class="admin">
  <header class="topbar">
    <div class="topbar__brand">
      <img src="${v('/images/logomark.png')}" alt="" width="242" height="354" class="topbar__mark">
      <span class="topbar__name">MEISTER</span>
      <span class="topbar__tag">YÖNETİM</span>
    </div>
    <div class="topbar__right">
      <a class="topbar__link" href="/" target="_blank" rel="noopener">SİTEYİ GÖR ↗</a>
      <span class="topbar__user">${email}</span>
      <button class="btn-admin btn-admin--ghost" type="button" id="logout">ÇIKIŞ</button>
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" data-panel="hero" aria-selected="true">HERO</button>
    <button class="tab" role="tab" data-panel="why" aria-selected="false">NEDEN BİZ</button>
    <button class="tab" role="tab" data-panel="products" aria-selected="false">HİZMETLER</button>
    <button class="tab" role="tab" data-panel="shop" aria-selected="false">ÜRÜNLER</button>
    <button class="tab" role="tab" data-panel="contact" aria-selected="false">İLETİŞİM</button>
    <button class="tab" role="tab" data-panel="seo" aria-selected="false">SEO</button>
    <button class="tab" role="tab" data-panel="inbox" aria-selected="false">MESAJLAR</button>
    <button class="tab" role="tab" data-panel="account" aria-selected="false">HESAP</button>
  </nav>

  <main class="wrap" id="app" aria-busy="true">
    <p class="loading">Yükleniyor…</p>
  </main>

  <div class="savebar" id="savebar" hidden>
    <span class="savebar__text" id="savebar-text">Kaydedilmemiş değişiklikler var</span>
    <button class="btn-admin btn-admin--ghost" type="button" id="discard">GERİ AL</button>
    <button class="btn-admin" type="button" id="save">KAYDET</button>
  </div>

  <script src="${v('/assets/admin.js')}" defer></script>
</body>
</html>
`;
}
