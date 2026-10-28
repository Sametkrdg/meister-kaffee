/**
 * GET /cerez-politikasi
 * Bkz. functions/kvkk-aydinlatma-metni.js — neden Function olduğu orada açıklandı.
 */

import { renderCookiePage } from '../src/templates/legal.js';
import { resolveAssetVersion } from '../src/lib/assets.js';
import { headFromGet } from '../src/lib/head.js';

export async function onRequestGet({ env }) {
  return new Response(renderCookiePage(resolveAssetVersion(env)), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export const onRequestHead = headFromGet(onRequestGet);
