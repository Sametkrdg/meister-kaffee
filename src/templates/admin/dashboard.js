import { escapeHtml } from '../../lib/validate.js';

/**
 * Panel kabuğu. İçerik sunucuda basılmaz; admin.js açılışta
 * GET /api/admin/content ile doldurur ve PUT ile kaydeder.
 *
 * Böylece panel her zaman KV'deki güncel hali gösterir ve kaydetme
 * sonrası sayfa yenilemeye gerek kalmaz.
 */
export function renderDashboard({ session }) {
  const email = escapeHtml(session?.sub || '');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yönetim Paneli — Meister Kaffee-Rösterei</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="/images/favicon.png" type="image/png">
  <link rel="stylesheet" href="/assets/admin.css">
</head>
<body class="admin">
  <header class="topbar">
    <div class="topbar__brand">
      <img src="/images/logomark.png" alt="" width="512" height="512" class="topbar__mark">
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
    <button class="tab" role="tab" data-panel="hero" aria-selected="true">01/ HERO</button>
    <button class="tab" role="tab" data-panel="why" aria-selected="false">02/ NEDEN BİZ</button>
    <button class="tab" role="tab" data-panel="products" aria-selected="false">03/ HİZMETLER</button>
    <button class="tab" role="tab" data-panel="contact" aria-selected="false">04/ İLETİŞİM</button>
    <button class="tab" role="tab" data-panel="inbox" aria-selected="false">05/ MESAJLAR</button>
  </nav>

  <main class="wrap" id="app" aria-busy="true">
    <p class="loading">Yükleniyor…</p>
  </main>

  <div class="savebar" id="savebar" hidden>
    <span class="savebar__text" id="savebar-text">Kaydedilmemiş değişiklikler var</span>
    <button class="btn-admin btn-admin--ghost" type="button" id="discard">GERİ AL</button>
    <button class="btn-admin" type="button" id="save">KAYDET</button>
  </div>

  <script src="/assets/admin.js" defer></script>
</body>
</html>
`;
}
