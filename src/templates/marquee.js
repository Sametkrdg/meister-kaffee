import { escapeHtml } from '../lib/validate.js';

/**
 * Kayan şerit — hero ile Neden Biz arasındaki teknik bant.
 *
 * İçerik ayrı bir KV alanı değildir: content:why-us başlıklarından üretilir,
 * böylece admin panelinden bir kart düzenlendiğinde şerit de kendiliğinden
 * güncellenir ve iki yerde aynı metni tutmak gerekmez.
 *
 * CSS animasyonu -50% kaydırdığı için içerik iki kez basılır (kesintisiz döngü).
 */
export function renderMarquee({ whyUs }) {
  const titles = (Array.isArray(whyUs) ? whyUs : [])
    .map((item) => item && item.title)
    .filter(Boolean);

  if (titles.length === 0) return '';

  const phrase =
    titles
      .map((t) => escapeHtml(t).toLocaleUpperCase('tr-TR'))
      .join(' — ') + ' — ';

  // Grup başına iki tur: kısa listelerde de şerit ekranı doldurur.
  const group = `<span class="marquee__group">${phrase.repeat(2)}</span>`;

  return `
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">${group}${group}</div>
  </div>`;
}
