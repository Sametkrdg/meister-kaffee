/**
 * POST /api/admin/login
 *
 * Bu endpoint bilinçli olarak korumasızdır (oturum burada doğuyor).
 * Buna karşılık ADMIN_KV'deki sayaçla kaba kuvvet denemelerine karşı kilitlenir.
 */

import { KEYS } from '../../../src/lib/kv-schema.js';
import {
  LOCKOUT,
  SESSION_TTL_SECONDS,
  buildSessionCookie,
  createSessionPayload,
  signSession,
  verifyPassword,
} from '../../../src/lib/auth.js';
import {
  buildCsrfCookie,
  generateCsrfToken,
  jsonResponse,
} from '../../../src/lib/admin-guard.js';
import { isEmail } from '../../../src/lib/validate.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SESSION_SECRET || !env.PASSWORD_PEPPER) {
    console.error('[admin/login] SESSION_SECRET veya PASSWORD_PEPPER tanımlı değil');
    return jsonResponse({ ok: false, error: 'Sunucu yapılandırması eksik.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Geçersiz istek.' }, 400);
  }

  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');

  if (!isEmail(email) || !password) {
    return jsonResponse({ ok: false, error: 'E-posta veya şifre hatalı.' }, 401);
  }

  const lockKey = KEYS.lockout(email);

  // 1) Kilit durumu
  let lock = null;
  try {
    lock = await env.ADMIN_KV.get(lockKey, { type: 'json' });
  } catch {
    /* kilit okunamazsa girişi engelleme, sadece sayaç tutulamamış olur */
  }

  if (lock && lock.count >= LOCKOUT.maxAttempts) {
    const remaining = Math.max(0, Math.ceil((lock.until - Date.now()) / 60000));
    return jsonResponse(
      {
        ok: false,
        error: `Çok fazla hatalı deneme. Hesap geçici olarak kilitlendi (${remaining} dk).`,
      },
      429
    );
  }

  // 2) Kimlik bilgisi
  let credentials = null;
  try {
    credentials = await env.ADMIN_KV.get(KEYS.credentials, { type: 'json' });
  } catch (error) {
    console.error('[admin/login] ADMIN_KV okunamadı:', error && error.message);
  }

  if (!credentials) {
    console.error('[admin/login] admin:credentials bulunamadı veya JSON parse edilemedi');
    return jsonResponse({ ok: false, error: 'Yönetici hesabı yapılandırılmamış.' }, 500);
  }

  const emailMatches = credentials.email === email;

  // E-posta yanlış olsa bile hash hesapla: doğru/yanlış e-postayı yanıt
  // süresinden ayırt etmeyi zorlaştırır.
  let passwordMatches = false;
  try {
    passwordMatches = await verifyPassword(password, credentials, env.PASSWORD_PEPPER);
  } catch (error) {
    if (error && error.code === 'ITERATIONS_TOO_HIGH') {
      console.error('[admin/login]', error.message);
      return jsonResponse(
        {
          ok: false,
          error:
            'Yönetici hesabı eski bir güvenlik ayarıyla kaydedilmiş ve doğrulanamıyor. ' +
            'Kurulum scripti (npm run seed) yeniden çalıştırılmalı.',
        },
        503
      );
    }
    console.error('[admin/login] doğrulama hatası:', error && error.message);
    return jsonResponse({ ok: false, error: 'Giriş sırasında bir hata oluştu.' }, 500);
  }

  if (!emailMatches || !passwordMatches) {
    await registerFailure(env, lockKey, lock);
    return jsonResponse({ ok: false, error: 'E-posta veya şifre hatalı.' }, 401);
  }

  // 3) Başarılı giriş — kilidi temizle, oturum ver
  try {
    await env.ADMIN_KV.delete(lockKey);
  } catch {
    /* önemsiz */
  }

  const csrf = generateCsrfToken();
  const token = await signSession(createSessionPayload(email, csrf), env.SESSION_SECRET);

  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  headers.append('Set-Cookie', buildSessionCookie(token));
  headers.append('Set-Cookie', buildCsrfCookie(csrf, SESSION_TTL_SECONDS));

  return new Response(JSON.stringify({ ok: true, redirect: '/admin' }), { status: 200, headers });
}

async function registerFailure(env, lockKey, current) {
  const count = (current?.count || 0) + 1;
  const until = Date.now() + LOCKOUT.windowSeconds * 1000;

  try {
    await env.ADMIN_KV.put(
      lockKey,
      JSON.stringify({ count, until }),
      { expirationTtl: LOCKOUT.windowSeconds }
    );
  } catch (error) {
    console.error('[admin/login] kilit sayacı yazılamadı:', error && error.message);
  }
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
