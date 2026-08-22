/**
 * GET /cerez-politikasi
 * Bkz. functions/kvkk-aydinlatma-metni.js — neden Function olduğu orada açıklandı.
 */

import { renderCookiePage } from '../src/templates/legal.js';

export async function onRequestGet() {
  return new Response(renderCookiePage(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
