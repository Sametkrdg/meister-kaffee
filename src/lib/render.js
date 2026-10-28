/**
 * render.js — şablonları KV içeriğiyle birleştirip nihai HTML dizesini üretir.
 * functions/index.js yalnızca bu fonksiyonu çağırır.
 */

import { renderLayout } from '../templates/layout.js';
import { renderShowcase } from '../templates/showcase.js';
import { renderNav } from '../templates/nav.js';
import { renderHero } from '../templates/hero.js';
import { renderMarquee } from '../templates/marquee.js';
import { renderWhyUs } from '../templates/why-us.js';
import { renderServicesProducts } from '../templates/services-products.js';
import { renderShop } from '../templates/shop.js';
import { renderMarketplace } from '../templates/marketplace.js';
import { renderContact } from '../templates/contact.js';
import { renderFooter } from '../templates/footer.js';
import { SHOWCASE_PHOTOS } from './showcase-photos.js';

/**
 * @param {object} content kv-schema.readSiteContent() çıktısı
 * @param {string} origin  isteğin origin'i (mutlak OG/canonical URL için)
 * @param {string} assetVersion statik varlık sürüm damgası (bkz. lib/assets.js)
 * @returns {string} tam HTML belgesi
 */
export function renderHomePage(content, origin, assetVersion) {
  const { hero, whyUs, products, contact, shop, seo, seoSections, seoProducts } = content;

  // Sıra müşteri kararıdır (28 Ekim 2026): vitrin → menü → Ürünlerimiz →
  // "Zanaatkâr titizliğiyle kavrulmuş" (hero) → kalan bölümler.
  const body = [
    renderShowcase({ photos: SHOWCASE_PHOTOS, shop, contact, assetVersion }),
    renderNav({ hero, assetVersion, hasShop: shop.length > 0 }),
    '<main class="page" id="icerik">',
    renderShop({ items: shop, contact, assetVersion }),
    renderHero({ hero, contact }),
    renderMarquee({ whyUs }),
    renderWhyUs({ whyUs }),
    renderServicesProducts({ products }),
    renderMarketplace({ contact }),
    renderContact({ contact }),
    '</main>',
    renderFooter(),
  ].join('\n');

  return renderLayout({ seo, contact, products, origin, body, assetVersion, seoSections, seoProducts });
}
