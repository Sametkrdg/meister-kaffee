import { escapeHtml } from '../lib/validate.js';
import { asset } from '../lib/assets.js';

/**
 * Sticky üst menü. Bağlantılar monospace ile dizilir.
 *
 * Mobilde bağlantılar açılır panele döner; panelin açılıp kapanmasını
 * public/assets/main.js yönetir (progressive enhancement — JS yoksa
 * bağlantılar yine de sayfada mevcuttur).
 */

const LINKS = [
  { label: 'NEDEN BİZ', href: '#neden-biz' },
  { label: 'HİZMETLER', href: '#hizmetler' },
  { label: 'İLETİŞİM', href: '#iletisim' },
];

export function renderNav({ hero, assetVersion }) {
  const ctaLabel = escapeHtml(hero?.ctaLabel || 'BİZİMLE İLETİŞİME GEÇ');

  const links = LINKS.map(
    (l) => `<a class="nav__link" href="${l.href}">${l.label}</a>`
  ).join('\n      ');

  return `
  <header class="nav">
    <!-- aria-label, GÖRÜNEN metni birebir içermek zorunda (WCAG 2.5.3
         "Label in Name"): içerideki yazı "MEISTER" + "KAFFEERÖSTEREI".
         Farklı yazılırsa sesli okuyucu adı ile ekrandaki ad ayrışır ve
         sesle komut veren kullanıcı bağlantıyı adlandıramaz. -->
    <a class="brand" href="#top" aria-label="MEISTER KAFFEERÖSTEREI — ana sayfa">
      <img class="brand__mark" src="${asset('/images/logomark.png', assetVersion)}" alt="" width="242" height="354" aria-hidden="true">
      <span class="brand__text">
        <span class="brand__name">MEISTER</span>
        <span class="brand__sub">KAFFEERÖSTEREI</span>
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
