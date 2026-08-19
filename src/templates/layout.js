import { renderSeoHead } from '../lib/seo.js';

/**
 * layout.js — sayfa kabuğu. <head> içindeki SEO bloğunu seo.js doldurur.
 *
 * Kritik fontlar preload edilir: SSR HTML'i CSS'ten önce geldiği için
 * Fraunces/Inter'in latin dosyaları erken istenmezse başlıklar fallback
 * fontla bir kare boyunca çizilir.
 */
export function renderLayout({ seo, contact, products, origin, body }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${renderSeoHead({ seo, contact, products, origin })}

  <link rel="icon" href="/images/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="/images/favicon.png">

  <link rel="preload" href="/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/main.css">
</head>
<body>
  <a class="skip-link" href="#neden-biz">İçeriğe geç</a>
${body}
  <script src="/assets/main.js" defer></script>
</body>
</html>
`;
}
