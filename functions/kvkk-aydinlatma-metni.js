/**
 * GET /kvkk-aydinlatma-metni
 *
 * Function olarak servis edilir (statik HTML değil): Pages'te
 * `functions/_middleware.js` statik varlıkları sarmadığı için statik bir
 * sayfa CSP ve X-Frame-Options olmadan yayınlanırdı.
 */

import { renderKvkkPage } from '../src/templates/legal.js';
import { resolveAssetVersion } from '../src/lib/assets.js';
import { headFromGet } from '../src/lib/head.js';

export async function onRequestGet({ env }) {
  return new Response(renderKvkkPage(resolveAssetVersion(env)), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export const onRequestHead = headFromGet(onRequestGet);
