import { escapeHtml, safeUrl } from '../lib/validate.js';
import { asset } from '../lib/assets.js';

/**
 * Vitrin — sayfanın en üstünde, menünün ÜSTÜNDE tam genişlikte, animasyonlu
 * sahne bandı.
 *
 * Arka planlar repodan gelir: public/images/showcase/ + src/lib/showcase-photos.js
 * (üreten: scripts/build-showcase-photos.mjs). Görsel yoksa bölüm render
 * edilmez ve sayfa yine menüyle başlar.
 *
 * Bir görselin id'si (dosya adının slug'ı) SCENES'te varsa üstüne metin ve
 * dekupe paketler (shop-photos.js `cutout`) bindirilir; yoksa düz tam genişlik
 * görsel olarak gösterilir. Böylece müşterinin kendi çekimleri dosya
 * eklenerek vitrine girer, kod değişmez.
 *
 * Animasyonların hepsi CSS'tedir ve yalnızca `.is-active` slaytta çalışır
 * (arka plan yakınlaşması, satır maskesi, paket girişi + süzülme).
 * Slayt geçişi public/assets/main.js'tedir: süre çubuğunun animasyonu
 * bitince sonraki slayta geçilir. JS yoksa yalnızca ilk slayt görünür.
 */

/**
 * Sahne metinleri. Başlık satırları "|" ile ayrılır.
 * İddialar sitenin onaylı metinlerinden alınmıştır (kv-schema DEFAULTS);
 * yeni bir iddia eklemeden önce müşteriye sorun.
 *
 * cta.href: '#bölüm' veya 'trendyol' (mağaza linki boşsa #urunler'e düşer).
 * packs:    shop-photos.js id'leri; dekupesi olmayan ürün atlanır.
 */
const SCENES = {
  'kavurma-kazanina-dokulen-taze-cekirdekler': {
    eyebrow: 'TAZE KAVRUM',
    title: 'Kavrulur,|paketlenir,|yola çıkar.',
    text: 'Kavrulduktan sonra siparişinize göre paketlenir, asla stokta bekletilmez.',
    cta: { label: 'ÜRÜNLERİ İNCELE', href: '#urunler' },
    packs: ['espresso-italiano'],
  },
  'taze-kavrulmus-kahve-cekirdekleri': {
    eyebrow: 'ÜRÜNLERİMİZ',
    title: 'Dört çeşit,|tek standart.',
    text: 'Espresso blendlerinden single origin filtre kahvelere; her lot kupalama testinden geçer.',
    cta: { label: 'TRENDYOL’DA İNCELE', href: 'trendyol' },
    packs: ['espresso-italiano', 'espresso-ethiopian-magic', 'ethiopia-lekempt', 'colombia-supremo'],
  },
  'portafiltrede-espresso-ve-latte': {
    eyebrow: 'KURUMSAL KAHVE ORTAĞINIZ',
    title: 'Kafeniz, oteliniz,|ofisiniz için.',
    text: 'Düzenli teslimat, esnek sipariş hacimleri ve barista desteğiyle.',
    cta: { label: 'BİZİMLE İLETİŞİME GEÇ', href: '#iletisim' },
    packs: ['espresso-ethiopian-magic', 'ethiopia-lekempt'],
  },
};

const PAUSE_ICON =
  '<svg class="showcase__icon showcase__icon--pause" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor"/></svg>';
const PLAY_ICON =
  '<svg class="showcase__icon showcase__icon--play" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5l9 5.5-9 5.5z" fill="currentColor"/></svg>';

/** Her satır kendi maskesinde aşağıdan açılır; --d gecikme sırasıdır. */
function renderTitle(raw) {
  return escapeHtml(raw)
    .split('|')
    .map((line, i) => `<span class="showcase__line"><span style="--d:${i}">${line.trim()}</span></span>`)
    .join(' ');
}

function renderCta(cta, trendyol) {
  if (!cta) return '';

  if (cta.href === 'trendyol') {
    if (!trendyol) return renderCta({ label: 'ÜRÜNLERİ İNCELE', href: '#urunler' });
    return `<a class="btn btn--light showcase__cta" href="${trendyol}" target="_blank" rel="noopener noreferrer">${escapeHtml(cta.label)} ↗</a>`;
  }

  return `<a class="btn btn--light showcase__cta" href="${escapeHtml(cta.href)}">${escapeHtml(cta.label)} →</a>`;
}

function renderPacks(ids, shopById, v) {
  const packs = (ids || []).map((id) => shopById.get(id)).filter((p) => p && p.cutout);
  if (packs.length === 0) return '';

  // Paketler yelpaze gibi dizilir: ortadakiler dik, kenardakiler hafif eğik.
  const mid = (packs.length - 1) / 2;
  const imgs = packs
    .map((p, i) => {
      const rot = packs.length > 1 ? ((i - mid) * 4).toFixed(1) : '-3';
      return `<img class="showcase__pack" src="${v(p.cutout.src)}" alt="${escapeHtml(p.name)}"
             width="${Number(p.cutout.width) || ''}" height="${Number(p.cutout.height) || ''}"
             style="--i:${i};--rot:${rot}deg" decoding="async">`;
    })
    .join('');

  return `<div class="showcase__packs" style="--n:${packs.length}">${imgs}</div>`;
}

export function renderShowcase({ photos, shop, contact, assetVersion }) {
  const list = Array.isArray(photos) ? photos : [];
  if (list.length === 0) return '';

  const v = (path) => asset(path, assetVersion);
  const multi = list.length > 1;
  const trendyol = safeUrl(contact?.marketplaceLinks?.trendyol);
  const shopById = new Map((Array.isArray(shop) ? shop : []).map((p) => [p.id, p]));

  const slides = list
    .map((p, i) => {
      const scene = SCENES[p.id];
      // İlk görsel sayfanın LCP öğesidir: hemen ve öncelikli yüklenir.
      const loading = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
      const slideAttrs = multi ? ` aria-roledescription="slayt" aria-label="${i + 1} / ${list.length}"` : '';

      const body = scene
        ? `
        <div class="showcase__shade" aria-hidden="true"></div>
        <div class="showcase__body">
          <p class="showcase__eyebrow"><span class="dot" aria-hidden="true"></span>${escapeHtml(scene.eyebrow)}</p>
          <p class="showcase__title">${renderTitle(scene.title)}</p>
          <p class="showcase__text">${escapeHtml(scene.text)}</p>
          ${renderCta(scene.cta, trendyol)}
        </div>
        ${renderPacks(scene.packs, shopById, v)}`
        : '';

      return `
      <li class="showcase__slide${i === 0 ? ' is-active' : ''}${scene ? ' showcase__slide--scene' : ''}"${slideAttrs} style="--k:${i}">
        <img class="showcase__bg" src="${v(p.src)}"
             srcset="${v(p.srcSmall)} ${Number(p.widthSmall) || ''}w, ${v(p.src)} ${Number(p.width) || ''}w" sizes="100vw"
             alt="${escapeHtml(p.alt)}" width="${Number(p.width) || ''}" height="${Number(p.height) || ''}"
             ${loading} decoding="async">${body}
      </li>`;
    })
    .join('');

  const steps = list
    .map(
      (_, i) => `
        <button class="showcase__step${i === 0 ? ' is-current' : ''}" type="button" data-showcase="${i}" aria-label="${i + 1}. görsele geç"><span class="showcase__fill"></span></button>`
    )
    .join('');

  const controls = multi
    ? `
    <div class="showcase__steps" hidden>${steps}
    </div>
    <div class="showcase__controls" hidden>
      <button class="showcase__btn" type="button" data-showcase="pause" aria-label="Otomatik geçişi durdur">${PAUSE_ICON}${PLAY_ICON}</button>
      <button class="showcase__btn" type="button" data-showcase="prev" aria-label="Önceki görsel">←</button>
      <button class="showcase__btn" type="button" data-showcase="next" aria-label="Sonraki görsel">→</button>
    </div>`
    : '';

  return `
  <section class="showcase" aria-label="Vitrin"${multi ? ' aria-roledescription="karusel"' : ''}>
    <ul class="showcase__track" aria-live="off">${slides}
    </ul>${controls}
  </section>`;
}
