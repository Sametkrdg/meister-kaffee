/**
 * GET /kvkk-aydinlatma-metni
 *
 * Function olarak servis edilir (statik HTML değil): Pages'te
 * `functions/_middleware.js` statik varlıkları sarmadığı için statik bir
 * sayfa CSP ve X-Frame-Options olmadan yayınlanırdı.
 */

import { renderKvkkPage } from '../src/templates/legal.js';

export async function onRequestGet() {
  return new Response(renderKvkkPage(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
