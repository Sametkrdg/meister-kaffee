import { escapeHtml, safeUrl } from '../lib/validate.js';
import { asset } from '../lib/assets.js';

/**
 * Ürünlerimiz — fotoğraflı ürün vitrini.
 *
 * Liste KV'den değil, src/lib/shop-photos.js'ten gelir (üreten:
 * scripts/build-product-photos.mjs). Fotoğraf yoksa bölüm hiç render edilmez.
 *
 * Trendyol bağlantısı content:contact.marketplaceLinks.trendyol'dan gelir;
 * panelde girilmişse her kart mağazaya gider, boşsa kartlar düz görseldir
 * (kırık "#" bağlantısı olmaz).
 */
export function renderShop({ photos, contact, assetVersion }) {
  const items = Array.isArray(photos) ? photos : [];
  if (items.length === 0) return '';

  const trendyol = safeUrl(contact?.marketplaceLinks?.trendyol);

  const cards = items
    .map((p) => {
      const inner = `
        <div class="shop-card__media">
          <img class="shop-card__img" src="${asset(p.src, assetVersion)}" alt="${escapeHtml(p.name)}"
               width="${Number(p.width) || ''}" height="${Number(p.height) || ''}" loading="lazy" decoding="async">
        </div>
        <h3 class="shop-card__name">${escapeHtml(p.name)}</h3>
        ${trendyol ? `<span class="shop-card__cta">TRENDYOL’DA İNCELE</span>` : ''}`;

      return trendyol
        ? `<a class="shop-card" href="${trendyol}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : `<div class="shop-card">${inner}</div>`;
    })
    .join('');

  return `
  <section class="section" id="urunler" aria-labelledby="urunler-baslik">
    <div class="section__head">
      <div>
        <p class="eyebrow">ÜRÜNLERİMİZ</p>
        <h2 class="section__title" id="urunler-baslik">Taze kavrulmuş kahvelerimiz</h2>
      </div>
    </div>

    <div class="shop-grid">${cards}</div>
  </section>`;
}
