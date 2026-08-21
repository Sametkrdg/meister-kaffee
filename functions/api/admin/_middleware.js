/**
 * /api/admin/* için auth guard.
 *
 * DİKKAT: Bu dosya olmadan admin API'leri KORUMASIZ kalır.
 * `functions/admin/_middleware.js` yalnızca `/admin/*` yollarını sarar;
 * Pages Functions'ta middleware kendi klasörünün dışına çıkmaz.
 *
 * Auth mantığı yine src/lib/admin-guard.js'de — burada sadece HTML yerine
 * JSON dönmek ve CSRF'i zorunlu kılmak farklı.
 */

import {
  checkCsrf,
  isPublicAdminPath,
  jsonResponse,
  resolveSession,
} from '../../../src/lib/admin-guard.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Giriş endpoint'i oturum ister durumda olamaz.
  if (isPublicAdminPath(url.pathname)) return next();

  const result = await resolveSession(request, env);

  if (!result.ok) {
    const message =
      result.reason === 'no-secret'
        ? 'Sunucu yapılandırması eksik (SESSION_SECRET tanımlı değil).'
        : 'Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.';
    return jsonResponse({ ok: false, error: message, reason: result.reason }, 401);
  }

  if (!checkCsrf(request, result.session)) {
    return jsonResponse({ ok: false, error: 'CSRF doğrulaması başarısız.' }, 403);
  }

  context.data = { ...(context.data || {}), session: result.session };

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, headers });
}
