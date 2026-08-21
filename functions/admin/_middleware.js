/**
 * /admin/* için auth guard.
 *
 * Auth mantığı burada DEĞİL, src/lib/admin-guard.js'dedir — bkz. o dosyadaki
 * açıklama (Pages Functions routing'i iki middleware dosyası gerektiriyor,
 * ama mantık tek yerde duruyor).
 *
 * Bu klasöre eklenen her yeni sayfa otomatik olarak buradan geçer.
 */

import { isPublicAdminPath, resolveSession } from '../../src/lib/admin-guard.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Giriş ekranının kendisi korumasız olmalı, aksi halde sonsuz döngü olur.
  if (isPublicAdminPath(url.pathname)) return next();

  const result = await resolveSession(request, env);

  if (!result.ok) {
    const login = new URL('/admin/login', url.origin);
    // Girişten sonra kullanıcıyı istediği sayfaya geri götür.
    if (url.pathname !== '/admin') login.searchParams.set('devam', url.pathname);
    if (result.reason === 'no-secret') login.searchParams.set('hata', 'yapilandirma');

    return new Response(null, {
      status: 302,
      headers: { Location: login.toString(), 'Cache-Control': 'no-store' },
    });
  }

  // Oturum bilgisini alt route'lara taşı
  context.data = { ...(context.data || {}), session: result.session };

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  return new Response(response.body, { status: response.status, headers });
}
