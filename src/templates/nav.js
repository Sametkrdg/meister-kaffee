import { escapeHtml } from '../lib/validate.js';

/**
 * Sticky üst menü. Bağlantılar tasarımdaki gibi numaralandırılmıştır
 * (01/ 02/ 03/) ve monospace ile dizilir.
 *
 * Mobilde bağlantılar açılır panele döner; panelin açılıp kapanmasını
 * public/assets/main.js yönetir (progressive enhancement — JS yoksa
 * bağlantılar yine de sayfada mevcuttur).
 */

const LINKS = [
  { num: '01', label: 'NEDEN BİZ', href: '#neden-biz' },
  { num: '02', label: 'HİZMETLER', href: '#hizmetler' },
  { num: '03', label: 'İLETİŞİM', href: '#iletisim' },
];

export function renderNav({ hero }) {
  const ctaLabel = escapeHtml(hero?.ctaLabel || 'BİZİMLE İLETİŞİME GEÇ');

  const links = LINKS.map(
    (l) =>
      `<a class="nav__link" href="${l.href}"><span class="nav__num">${l.num}/</span> ${l.label}</a>`
  ).join('\n      ');

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
      ${links}
      <a class="btn btn--nav" href="#iletisim">${ctaLabel}</a>
    </nav>
  </header>`;
}
