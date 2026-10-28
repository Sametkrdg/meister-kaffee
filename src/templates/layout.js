import { renderSeoHead } from '../lib/seo.js';
import { asset } from '../lib/assets.js';

/**
 * layout.js — sayfa kabuğu. <head> içindeki SEO bloğunu seo.js doldurur.
 *
 * Kritik fontlar preload edilir: SSR HTML'i CSS'ten önce geldiği için
 * Fraunces/Inter/Space Mono'nun latin dosyaları erken istenmezse başlıklar
 * ve teknik etiketler bir kare boyunca fallback fontla çizilir.
 */

/** Tasarımın blueprint ızgarası: 12 sütun, sabit, tıklamayı engellemez. */
function renderGridOverlay() {
  return `  <div class="grid-overlay" aria-hidden="true">${'<span></span>'.repeat(12)}</div>`;
}

export function renderLayout({ seo, contact, products, origin, body, assetVersion, seoSections, seoProducts }) {
  const v = (path) => asset(path, assetVersion);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${renderSeoHead({ seo, contact, products, origin, assetVersion, seoSections, seoProducts })}

  <link rel="icon" href="${v('/images/favicon.png')}" type="image/png">
  <link rel="apple-touch-icon" href="${v('/images/favicon.png')}">

  <!-- Mobil tarayıcı çubuğu sayfanın kâğıt tonuyla aynı olsun. Site tek
       temalıdır (açık); color-scheme, form alanı ve kaydırma çubuğu gibi
       tarayıcı parçalarının koyu moda çevrilmesini engeller. -->
  <meta name="theme-color" content="#FAF9F6">
  <meta name="color-scheme" content="light">

  <link rel="preload" href="/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/space-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${v('/assets/main.css')}">

  <!-- Turnstile (bot koruması). CSP'de challenges.cloudflare.com izinli
       olmalıdır — bkz. functions/_middleware.js -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <a class="skip-link" href="#icerik">İçeriğe geç</a>
${renderGridOverlay()}
${body}
  <script src="${v('/assets/main.js')}" defer></script>
</body>
</html>
`;
}
