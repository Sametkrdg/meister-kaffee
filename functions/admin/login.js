/**
 * GET /admin/login — giriş ekranı.
 * Middleware bu yolu bilerek korumasız bırakır (bkz. admin-guard PUBLIC_PATHS).
 * Zaten oturumu olan kullanıcı panele yönlendirilir.
 */

import { renderLoginPage } from '../../src/templates/admin/login.js';
import { resolveSession } from '../../src/lib/admin-guard.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const existing = await resolveSession(request, env);
  if (existing.ok) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin', 'Cache-Control': 'no-store' },
    });
  }

  const html = renderLoginPage({
    nextPath: url.searchParams.get('devam') || '',
    configError: url.searchParams.get('hata') === 'yapilandirma',
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
