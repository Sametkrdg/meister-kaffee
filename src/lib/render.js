/**
 * render.js — şablonları KV içeriğiyle birleştirip nihai HTML dizesini üretir.
 * functions/index.js yalnızca bu fonksiyonu çağırır.
 */

import { renderLayout } from '../templates/layout.js';
import { renderNav } from '../templates/nav.js';
import { renderHero } from '../templates/hero.js';
import { renderWhyUs } from '../templates/why-us.js';
import { renderServicesProducts } from '../templates/services-products.js';
import { renderMarketplace } from '../templates/marketplace.js';
import { renderContact } from '../templates/contact.js';
import { renderFooter } from '../templates/footer.js';

/**
 * @param {object} content kv-schema.readSiteContent() çıktısı
 * @param {string} origin  isteğin origin'i (mutlak OG/canonical URL için)
 * @returns {string} tam HTML belgesi
 */
export function renderHomePage(content, origin) {
  const { hero, whyUs, products, contact, seo } = content;

  const body = [
    renderNav({ hero }),
    '<main>',
    renderHero({ hero }),
    renderWhyUs({ whyUs }),
    renderServicesProducts({ products }),
    renderMarketplace({ contact }),
    renderContact({ contact }),
    '</main>',
    renderFooter(),
  ].join('\n');

  return renderLayout({ seo, contact, products, origin, body });
}
