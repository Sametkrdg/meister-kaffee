import { escapeHtml } from '../lib/validate.js';

/**
 * Sticky üst menü. Mobilde bağlantılar açılır panele döner; panelin açılıp
 * kapanmasını public/assets/main.js yönetir (progressive enhancement —
 * JS yoksa bağlantılar yine de sayfada mevcuttur).
 */
export function renderNav({ hero }) {
  const ctaLabel = escapeHtml(hero?.ctaLabel || 'BİZİMLE İLETİŞİME GEÇ');

  return `
  <header class="nav">
    <a class="brand" href="#top" aria-label="Meister Kaffee-Rösterei ana sayfa">
      <img class="brand__mark" src="/images/logomark.png" alt="" width="512" height="512" aria-hidden="true">
      <span class="brand__text">
        <span class="brand__name">MEISTER</span>
        <span class="brand__sub">KAFFEE-RÖSTEREİ</span>
      </span>
    </a>

    <button class="nav__toggle" type="button"
            aria-expanded="false" aria-controls="nav-links" aria-label="Menüyü aç">
      ☰
    </button>

    <nav class="nav__links" id="nav-links" aria-label="Ana menü">
      <a class="nav__link" href="#neden-biz">Neden Biz</a>
      <a class="nav__link" href="#hizmetler">Hizmetler</a>
      <a class="nav__link" href="#iletisim">İletişim</a>
      <a class="btn btn--outline" href="#iletisim">${ctaLabel}</a>
    </nav>
  </header>`;
}
