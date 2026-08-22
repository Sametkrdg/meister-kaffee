import { safeUrl } from '../lib/validate.js';

/**
 * Mağazalarımız — Trendyol / Amazon bağlantıları.
 *
 * Bağlantılar content:contact.marketplaceLinks'ten gelir; admin panelinde
 * boş bırakılan pazaryeri hiç render edilmez (kırık "#" bağlantısı olmaz).
 * Her ikisi de boşsa bölüm tamamen gizlenir.
 */
export function renderMarketplace({ contact }) {
  const links = contact?.marketplaceLinks || {};

  const entries = [
    { label: 'TRENDYOL’DA KEŞFET', href: safeUrl(links.trendyol) },
    { label: 'AMAZON’DA KEŞFET', href: safeUrl(links.amazon) },
  ].filter((e) => e.href);

  if (entries.length === 0) return '';

  const buttons = entries
    .map(
      (e) => `
      <a class="market__link" href="${e.href}" target="_blank" rel="noopener noreferrer">
        <span class="market__dot" aria-hidden="true"></span>${e.label}
      </a>`
    )
    .join('');

  return `
  <section class="market" aria-labelledby="magazalar-baslik">
    <div class="market__intro">
      <p class="eyebrow" id="magazalar-baslik">MAĞAZALARIMIZ</p>
      <p class="market__text">Ürünlerimizi favori pazaryerlerinizden de temin edebilirsiniz.</p>
    </div>
    <div class="market__links">${buttons}</div>
  </section>`;
}
