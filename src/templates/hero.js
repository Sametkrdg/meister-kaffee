import { escapeHtml, safeUrl } from '../lib/validate.js';

/**
 * Hero — sola hizalı dev display tipografi, teknik köşe etiketleri ve
 * scroll'a bağlı parallax/eğim efekti. Sayfanın en üstünde değil,
 * "Ürünlerimiz"in altında durur (bkz. lib/render.js).
 *
 * Başlık biçimi (content:hero.headline):
 *   satırlar "|" ile ayrılır, vurgulanacak satır *yıldız* içine alınır.
 *   Örn: "ZANAATKÂR|*TİTİZLİĞİYLE*|KAVRULMUŞ"
 *
 * Güvenlik: metin ÖNCE escapeHtml'den geçer, işaretleme SONRA uygulanır —
 * bu yüzden içerikten HTML enjekte edilemez.
 */
function renderHeadline(raw) {
  return escapeHtml(raw || '')
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const accent = line.startsWith('*') && line.endsWith('*') && line.length > 2;
      return accent
        ? `<span class="hero__accent">${line.slice(1, -1)}</span>`
        : line;
    })
    .join('<br>');
}

export function renderHero({ hero, contact }) {
  const eyebrow = escapeHtml(hero?.eyebrow || '');
  const headline = renderHeadline(hero?.headline);
  const subheadline = escapeHtml(hero?.subheadline || '');
  const ctaLabel = escapeHtml(hero?.ctaLabel || 'BİZİMLE İLETİŞİME GEÇ');
  const ctaHref = safeUrl(hero?.ctaHref) || '#iletisim';

  const coordinates = escapeHtml(contact?.coordinates || '');
  const address = escapeHtml(contact?.address || '');

  const marker = [coordinates, address.toLocaleUpperCase('tr-TR')]
    .filter(Boolean)
    .join('<br>');

  return `
  <section class="hero">
    ${marker ? `<p class="hero__marker hero__marker--right">${marker}</p>` : ''}

    ${eyebrow ? `<p class="hero__eyebrow"><span class="dot" aria-hidden="true"></span>${eyebrow}</p>` : ''}

    <h1 class="hero__title">${headline}</h1>

    <div class="hero__foot">
      ${subheadline ? `<p class="hero__lead">${subheadline}</p>` : ''}
      <a class="btn btn--hero" href="${ctaHref}">${ctaLabel} →</a>
    </div>
  </section>`;
}
