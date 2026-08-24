/**
 * seo.js — SEO/Open Graph/JSON-LD çıktısının TEK kaynağı.
 *
 * functions/index.js içine elle meta etiketi gömülmez; her şey buradan üretilir
 * (bkz. CLAUDE.md kuralları). Admin panelinden kaydedilen `seo:*` dokümanları
 * girdi, buradan dönen HTML bloğu çıktıdır.
 */

import { escapeHtml } from './validate.js';
import { asset } from './assets.js';

const SITE_NAME = 'Meister Kaffee-Rösterei';

/**
 * `</script>` dizisi JSON-LD bloğunu erken kapatıp script enjeksiyonuna yol
 * açabilir; JSON serileştirmesi bunu kendiliğinden kaçırmaz.
 */
function safeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const OG_DEFAULT = '/images/og-default.jpg';

/**
 * Yalnizca kendi origin'imizdeki (kok-goreli) yollara surum damgasi ekler.
 * Zaten sorgu tasiyan veya harici (http/https) bir URL degistirilmez.
 */
function versionLocal(url, assetVersion) {
  if (typeof url !== 'string' || !url.startsWith('/')) return url;
  if (url.includes('?')) return url;
  return asset(url, assetVersion);
}

/** Göreli yolu mutlak URL'e çevirir (OG/canonical mutlak adres ister). */
function absolute(url, origin) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!origin) return url;
  return origin.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`);
}

/**
 * Organization + her görünür ürün için Product şeması üretir.
 *
 * Üç kademeli override mantığı:
 *   1. `seo:home.jsonLd` doluysa TÜM grafiği o değiştirir (tam kontrol).
 *   2. `seo:product:{id}.jsonLd` doluysa o ürünün Product bloğu onunla değişir.
 *   3. Bölüm dokümanlarının (`seo:why-us`, `seo:services`, `seo:contact`)
 *      `jsonLd` alanı doluysa grafiğe ek blok olarak katılır.
 *
 * Hepsi `validate.js`'teki `validateJsonLd`'den geçmiş, parse edilebilir
 * nesnelerdir; buraya bozuk bir değer ulaşamaz.
 */
export function buildJsonLd({ seo, contact, products, origin, assetVersion, seoSections, seoProducts }) {
  if (seo && seo.jsonLd) return seo.jsonLd;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: origin || undefined,
    logo: absolute(versionLocal('/images/logo-full.png', assetVersion), origin) || undefined,
    description: seo?.metaDescription || undefined,
  };

  if (contact) {
    if (contact.email || contact.phone) {
      organization.contactPoint = [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: contact.email || undefined,
          telephone: contact.phone || undefined,
          areaServed: 'TR',
          availableLanguage: ['Turkish'],
        },
      ];
    }
    if (contact.address) {
      organization.address = { '@type': 'PostalAddress', addressLocality: contact.address };
    }
    const sameAs = [
      contact.marketplaceLinks?.trendyol,
      contact.marketplaceLinks?.amazon,
      contact.socialLinks?.instagram,
      contact.socialLinks?.linkedin,
    ].filter(Boolean);
    if (sameAs.length) organization.sameAs = sameAs;
  }

  const graph = [organization];

  // Bölüm dokümanlarının ek blokları
  for (const doc of Object.values(seoSections || {})) {
    if (!doc || !doc.jsonLd) continue;
    if (Array.isArray(doc.jsonLd)) graph.push(...doc.jsonLd);
    else graph.push(doc.jsonLd);
  }

  for (const p of products || []) {
    const override = p && p.id ? seoProducts?.[p.id]?.jsonLd : null;
    if (override) {
      if (Array.isArray(override)) graph.push(...override);
      else graph.push(override);
      continue;
    }

    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      category: p.category || undefined,
      description: p.description || undefined,
      image: p.imageUrl ? absolute(p.imageUrl, origin) : undefined,
      brand: { '@type': 'Brand', name: SITE_NAME },
    });
  }

  return graph;
}

/**
 * <head> içine girecek SEO bloğunu üretir.
 * @returns {string} HTML
 */
export function renderSeoHead({ seo, contact, products, origin, assetVersion, seoSections, seoProducts }) {
  const title = seo?.pageTitle || SITE_NAME;
  const description = seo?.metaDescription || '';
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;
  // OG görseli kendi origin'imizdeyse sürümlenir: sosyal ağlar görseli URL'e
  // göre önbelleğe alır, sürüm damgası olmadan görsel değiştiğinde eski kopya
  // paylaşımlarda görünmeye devam eder. Harici bir URL girilmişse dokunulmaz —
  // sorgu eklemek yabancı bir sunucuda görseli bozabilir.
  const ogImage = absolute(versionLocal(seo?.ogImage || OG_DEFAULT, assetVersion), origin);
  const canonical = seo?.canonical || origin || '';

  const jsonLd = buildJsonLd({ seo, contact, products, origin, assetVersion, seoSections, seoProducts });

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}">` : '',
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : '',

    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:locale" content="tr_TR">`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}">`,
    ogDescription ? `<meta property="og:description" content="${escapeHtml(ogDescription)}">` : '',
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : '',
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : '',

    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}">`,
    ogDescription ? `<meta name="twitter:description" content="${escapeHtml(ogDescription)}">` : '',
    ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : '',

    `<script type="application/ld+json">${safeJsonLd(jsonLd)}</script>`,
  ];

  return tags.filter(Boolean).join('\n  ');
}

/** sitemap.xml gövdesi — lastmod content:meta.updatedAt'ten gelir. */
export function renderSitemap({ origin, updatedAt }) {
  const base = escapeHtml((origin || '').replace(/\/$/, ''));
  const lastmod = updatedAt
    ? `\n    <lastmod>${escapeHtml(String(updatedAt).slice(0, 10))}</lastmod>`
    : '';

  // Ana sayfa KV içeriğiyle değiştiği için lastmod taşır; hukuki metinler
  // kod içinde sabit olduğundan changefreq'leri düşüktür.
  const urls = [
    { loc: `${base}/`, lastmod, changefreq: 'weekly', priority: '1.0' },
    { loc: `${base}/kvkk-aydinlatma-metni`, lastmod: '', changefreq: 'yearly', priority: '0.3' },
    { loc: `${base}/cerez-politikasi`, lastmod: '', changefreq: 'yearly', priority: '0.3' },
  ];

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.lastmod}\n` +
        `    <changefreq>${u.changefreq}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n  </url>\n`
    )
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '</urlset>\n'
  );
}
