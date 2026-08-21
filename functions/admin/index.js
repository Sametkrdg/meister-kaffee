/**
 * GET /admin — panel kabuğu.
 * Buraya gelebiliyorsa oturum zaten doğrulanmıştır (functions/admin/_middleware.js);
 * burada ayrıca auth kontrolü YAPILMAZ (CLAUDE.md kuralı).
 */

import { renderDashboard } from '../../src/templates/admin/dashboard.js';

export async function onRequestGet(context) {
  const html = renderDashboard({ session: context.data?.session });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
