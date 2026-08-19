import { escapeHtml, safeUrl } from '../lib/validate.js';

/**
 * Hero — logo sunumu, değer önerisi başlığı ve birincil CTA.
 * Başlıkta satır sonu isteniyorsa içerikte "|" kullanılır; başka hiçbir
 * işaretleme kabul edilmez (içerik admin panelinden geldiği için).
 */
export function renderHero({ hero }) {
  const eyebrow = escapeHtml(hero?.eyebrow || '');
  const headline = escapeHtml(hero?.headline || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('<br>');
  const subheadline = escapeHtml(hero?.subheadline || '');
  const ctaLabel = escapeHtml(hero?.ctaLabel || 'BİZİMLE İLETİŞİME GEÇ');
  const ctaHref = safeUrl(hero?.ctaHref) || '#iletisim';
  const logoUrl = safeUrl(hero?.logoUrl) || '/images/logomark.png';

  return `
  <section class="hero" id="top">
    <img class="hero__mark reveal" src="${logoUrl}" alt="Meister Kaffee-Rösterei"
         width="512" height="512" fetchpriority="high">

    ${eyebrow ? `<p class="hero__eyebrow reveal reveal--1">${eyebrow}</p>` : ''}

    <h1 class="hero__title reveal reveal--2">${headline}</h1>

    ${subheadline ? `<p class="hero__lead reveal reveal--3">${subheadline}</p>` : ''}

    <a class="btn btn--primary reveal reveal--4" href="${ctaHref}">${ctaLabel}</a>
  </section>`;
}
