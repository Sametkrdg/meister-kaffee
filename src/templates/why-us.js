import { escapeHtml } from '../lib/validate.js';
import { icon } from '../lib/icons.js';

/**
 * Neden Biz — content:why-us listesini okuyan CSS-grid bölümü.
 * Kartlar arasındaki 1px boşluk + grid arka planı Swiss hairline ızgarayı verir.
 */
export function renderWhyUs({ whyUs }) {
  const items = Array.isArray(whyUs) ? whyUs : [];

  const cards = items
    .map(
      (item) => `
      <article class="why-card">
        <span class="why-card__icon" style="color: var(--accent-bronze)">${icon(item.icon, {
          size: 30,
          stroke: 1.3,
        })}</span>
        <h3 class="why-card__title">${escapeHtml(item.title)}</h3>
        <p class="why-card__desc">${escapeHtml(item.description)}</p>
      </article>`
    )
    .join('');

  return `
  <section class="section" id="neden-biz" aria-labelledby="neden-biz-baslik">
    <div class="section__head">
      <div>
        <p class="eyebrow">NEDEN MEISTER</p>
        <h2 class="section__title" id="neden-biz-baslik">Sıradan tedarikçi değil, kahve ortağınız</h2>
      </div>
      <p class="section__note">
        Her parti, kalite kontrol sürecimizden ve zanaatkâr kavurma standartlarımızdan geçer.
      </p>
    </div>

    <div class="why-grid">${cards}</div>
  </section>`;
}
