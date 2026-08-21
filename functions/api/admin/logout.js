/**
 * POST /api/admin/logout — oturumu sonlandırır.
 * Guard'dan geçer (CSRF zorunlu), böylece istenmeden çıkış yaptırılamaz.
 */

import { clearSessionCookie } from '../../../src/lib/auth.js';
import { clearCsrfCookie } from '../../../src/lib/admin-guard.js';

export async function onRequestPost() {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  headers.append('Set-Cookie', clearSessionCookie());
  headers.append('Set-Cookie', clearCsrfCookie());

  return new Response(JSON.stringify({ ok: true, redirect: '/admin/login' }), {
    status: 200,
    headers,
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
