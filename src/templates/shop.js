import { escapeHtml, safeUrl } from '../lib/validate.js';
import { asset } from '../lib/assets.js';

/**
 * Ürünlerimiz — fotoğraflı ürün vitrini.
 *
 * Fotoğraflar repodan (src/lib/shop-photos.js, üreten:
 * scripts/build-product-photos.mjs), ad + detay satırı panelden
 * (content:shop) gelir — birleştiren: kv-schema.mergeShop().
 * Fotoğraf yoksa bölüm hiç render edilmez.
 *
 * Trendyol bağlantısı content:contact.marketplaceLinks.trendyol'dan gelir;
 * panelde girilmişse her kart mağazaya gider, boşsa kartlar düz görseldir
 * (kırık "#" bağlantısı olmaz).
 */

/** "250 g" satır sonunda "250 / g" diye bölünmesin (escape'ten SONRA uygulanır). */
function keepUnits(html) {
  return html.replace(/(\d) (?=(?:k?g|gr|ml|lt?)\b)/gi, '$1&nbsp;');
}

export function renderShop({ items, contact, assetVersion }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return '';

  const trendyol = safeUrl(contact?.marketplaceLinks?.trendyol);

  const cards = list
    .map((p) => {
      const inner = `
        <div class="shop-card__media">
          <img class="shop-card__img" src="${asset(p.src, assetVersion)}" alt="${escapeHtml(p.name)}"
               width="${Number(p.width) || ''}" height="${Number(p.height) || ''}" loading="lazy" decoding="async">
        </div>
        <h3 class="shop-card__name">${escapeHtml(p.name)}</h3>
        ${p.detail ? `<p class="shop-card__detail">${keepUnits(escapeHtml(p.detail))}</p>` : ''}
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
