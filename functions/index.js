/**
 * GET / — ana sayfanın edge-SSR'ı.
 *
 * Her istekte CONTENT_KV'den güncel içerik okunur ve tam HTML sunucuda
 * üretilir. Böylece admin panelindeki bir değişiklik yeniden deploy
 * gerektirmeden bir sonraki istekte yayında olur ve arama motoru
 * botları her zaman dolu HTML alır (client-side hydration yok).
 */

import { readSiteContent, DEFAULTS, KEYS, SEO_DEFAULTS } from '../src/lib/kv-schema.js';
import { renderHomePage } from '../src/lib/render.js';

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // Kısa TTL + stale-while-revalidate: admin düzenlemesi hızla yayılır,
  // ama trafik yoğunluğunda her istek KV okumaz.
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;

  try {
    // readSiteContent tek tek anahtarlarda zaten hataya dayanıklıdır:
    // KV erişilemezse veya anahtar boşsa kv-schema varsayılanına düşer.
    // Buradaki catch yalnızca beklenmedik render hatalarını yakalar.
    const content = await readSiteContent(env.CONTENT_KV);
    return new Response(renderHomePage(content, origin), { headers: HTML_HEADERS });
  } catch (error) {
    console.error('[index] SSR hatası:', error && error.message);

    const fallback = {
      hero: DEFAULTS[KEYS.hero],
      whyUs: DEFAULTS[KEYS.whyUs],
      products: DEFAULTS[KEYS.products],
      contact: DEFAULTS[KEYS.contact],
      seo: SEO_DEFAULTS.home,
    };

    return new Response(renderHomePage(fallback, origin), {
      status: 200,
      headers: { ...HTML_HEADERS, 'Cache-Control': 'no-store' },
    });
  }
}
