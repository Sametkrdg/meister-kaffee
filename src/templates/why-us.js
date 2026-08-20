import { escapeHtml } from '../lib/validate.js';
import { icon } from '../lib/icons.js';

/**
 * Neden Biz — content:why-us listesini okuyan CSS-grid bölümü.
 * Kartlar teknik bir kimlik etiketi taşır (A0, A1 …) ve kenarlıklar
 * kartların üzerinde olduğu için ızgara tek sürekli çizgi gibi okunur.
 */
export function renderWhyUs({ whyUs }) {
  const items = Array.isArray(whyUs) ? whyUs : [];

  const cards = items
    .map(
      (item, index) => `
      <article class="why-card">
        <p class="why-card__id">A${index}</p>
        <span class="why-card__icon">${icon(item.icon, { size: 28, stroke: 1.3 })}</span>
        <h3 class="why-card__title">${escapeHtml(item.title)}</h3>
        <p class="why-card__desc">${escapeHtml(item.description)}</p>
      </article>`
    )
    .join('');

  return `
  <section class="section" id="neden-biz" aria-labelledby="neden-biz-baslik">
    <div class="section__head">
      <div>
        <p class="eyebrow"><span class="eyebrow__num">01/</span> NEDEN MEISTER</p>
        <h2 class="section__title" id="neden-biz-baslik">Sıradan tedarikçi değil,<br>kahve ortağınız</h2>
      </div>
      <p class="section__note">
        FIG.01 — Her parti, kalite kontrol sürecimizden ve zanaatkâr kavurma standartlarımızdan geçer.
      </p>
    </div>

    <div class="why-grid">${cards}</div>
  </section>`;
}
