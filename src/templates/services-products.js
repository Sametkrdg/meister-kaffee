import { escapeHtml } from '../lib/validate.js';

/**
 * Hizmetler & Ürünler — content:products listesini render eder.
 * Ürünler `order` alanına göre sıralanmış ve görünür olanlar filtrelenmiş
 * halde gelir (bkz. kv-schema.readSiteContent).
 */
export function renderServicesProducts({ products }) {
  const items = Array.isArray(products) ? products : [];

  const cards = items
    .map((p) => {
      const points = (Array.isArray(p.points) ? p.points : [])
        .map((pt) => `<li class="svc-card__point">${escapeHtml(pt)}</li>`)
        .join('');

      return `
      <article class="svc-card" id="urun-${escapeHtml(p.id)}">
        ${p.category ? `<p class="svc-card__tag">${escapeHtml(p.category)}</p>` : ''}
        <h3 class="svc-card__title">${escapeHtml(p.name)}</h3>
        <p class="svc-card__desc">${escapeHtml(p.description)}</p>
        ${points ? `<hr class="svc-card__rule"><ul class="svc-card__points">${points}</ul>` : ''}
      </article>`;
    })
    .join('');

  return `
  <section class="section section--alt" id="hizmetler" aria-labelledby="hizmetler-baslik">
    <div style="margin-bottom: var(--sp-8)">
      <p class="eyebrow">HİZMETLER &amp; ÜRÜNLER</p>
      <h2 class="section__title" id="hizmetler-baslik">İşletmenize özel çözümler</h2>
    </div>

    <div class="svc-grid">${cards}</div>
  </section>`;
}
