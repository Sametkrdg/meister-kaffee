/**
 * GET /sitemap.xml
 *
 * Tek kanonik URL'li küçük bir site haritası. `lastmod`, admin panelindeki
 * her yazmada güncellenen content:meta.updatedAt'ten gelir — böylece arama
 * motorları içerik değiştiğinde haberdar olur.
 *
 * Çıktı src/lib/seo.js'den üretilir (SEO'nun tek kaynağı orası).
 */

import { KEYS, readDoc } from '../src/lib/kv-schema.js';
import { renderSitemap } from '../src/lib/seo.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  const meta = await readDoc(env.CONTENT_KV, KEYS.meta, {});

  return new Response(renderSitemap({ origin, updatedAt: meta && meta.updatedAt }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
