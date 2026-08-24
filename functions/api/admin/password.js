/**
 * POST /api/admin/password — yönetici şifresini değiştirir.
 *
 * Guard (functions/api/admin/_middleware.js) oturumu ve CSRF'i çoktan
 * doğruladı; burada yalnızca şifre mantığı var.
 *
 * NEDEN İKİ ADIM:
 * Şifre değiştirmek iki PBKDF2 işlemi gerektirir — mevcut şifreyi DOĞRULAMA
 * ve yeni şifreyi HASH'LEME. Her biri 50.000 iterasyon; ikisi tek istekte
 * 100.000 eder. Workers ücretsiz planında istek başına ~10 ms CPU var ve
 * 100.000 iterasyon ölçülen değerlerle ~6 istekte 1 kez bu limiti aşıyor
 * (bkz. CLAUDE.md, PBKDF2 kuralı). Rastgele başarısız olan bir şifre
 * değiştirme ekranı kabul edilemez, bu yüzden işlem ikiye bölündü:
 *
 *   1) step="dogrula"  → mevcut şifre kontrol edilir, kısa ömürlü bir
 *                        değişim jetonu döner (HMAC imzalı, KV'ye yazılmaz)
 *   2) step="uygula"   → jeton doğrulanır, yeni şifre hash'lenip yazılır
 *
 * Her adım tek bir PBKDF2 çalıştırır; CPU bütçesi güvende kalır.
 *
 * Jeton oturuma bağlıdır (sub eşleşmesi) ve 2 dakika yaşar; çalınsa bile
 * başka bir oturumda kullanılamaz.
 */

import { hashPassword, verifyPassword, signSession, verifySession } from '../../../src/lib/auth.js';
import { jsonResponse } from '../../../src/lib/admin-guard.js';

/** Seed scriptiyle aynı alt sınır — iki yerde farklı kural olmamalı. */
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 200;
const CHANGE_TOKEN_TTL_SECONDS = 120;

const CREDENTIALS_KEY = 'admin:credentials';

async function readCredentials(env) {
  try {
    return await env.ADMIN_KV.get(CREDENTIALS_KEY, { type: 'json' });
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const session = data?.session;

  if (!env.SESSION_SECRET || !env.PASSWORD_PEPPER) {
    console.error('[admin/password] SESSION_SECRET veya PASSWORD_PEPPER tanımlı değil');
    return jsonResponse({ ok: false, error: 'Sunucu yapılandırması eksik.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Geçersiz JSON gövdesi.' }, 400);
  }

  const credentials = await readCredentials(env);
  if (!credentials) {
    return jsonResponse({ ok: false, error: 'Yönetici hesabı bulunamadı.' }, 500);
  }

  /* ---- 1. adım: mevcut şifreyi doğrula ---------------------------------- */

  if (payload?.step === 'dogrula') {
    const current = String(payload.currentPassword || '');
    if (!current) {
      return jsonResponse({ ok: false, error: 'Mevcut şifre boş olamaz.' }, 400);
    }

    let matches = false;
    try {
      matches = await verifyPassword(current, credentials, env.PASSWORD_PEPPER);
    } catch (error) {
      if (error && error.code === 'ITERATIONS_TOO_HIGH') {
        console.error('[admin/password]', error.message);
        return jsonResponse({ ok: false, error: 'Sunucu yapılandırması güncellenmeli.' }, 500);
      }
      throw error;
    }

    if (!matches) {
      return jsonResponse({ ok: false, error: 'Mevcut şifre hatalı.' }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await signSession(
      { typ: 'pwchange', sub: session?.sub || '', iat: now, exp: now + CHANGE_TOKEN_TTL_SECONDS },
      env.SESSION_SECRET
    );

    return jsonResponse({ ok: true, token, expiresIn: CHANGE_TOKEN_TTL_SECONDS });
  }

  /* ---- 2. adım: yeni şifreyi yaz ---------------------------------------- */

  if (payload?.step === 'uygula') {
    const claims = await verifySession(String(payload.token || ''), env.SESSION_SECRET);

    // Jeton yalnızca bu amaç ve BU oturum için geçerlidir; aksi halde bir
    // oturum jetonu şifre değiştirmek için kullanılabilirdi.
    if (!claims || claims.typ !== 'pwchange' || !claims.sub || claims.sub !== session?.sub) {
      return jsonResponse(
        { ok: false, error: 'Doğrulama süresi doldu. Mevcut şifrenizi tekrar girin.' },
        400
      );
    }

    const next = String(payload.newPassword || '');
    if (next.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse(
        { ok: false, error: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` },
        400
      );
    }
    if (next.length > MAX_PASSWORD_LENGTH) {
      return jsonResponse({ ok: false, error: 'Yeni şifre çok uzun.' }, 400);
    }

    const fresh = await hashPassword(next, env.PASSWORD_PEPPER);

    try {
      await env.ADMIN_KV.put(
        CREDENTIALS_KEY,
        // E-posta korunur; yalnızca hash/salt/algo/iterations yenilenir.
        JSON.stringify({ email: credentials.email, ...fresh })
      );
    } catch (error) {
      console.error('[admin/password] KV yazma hatası:', error && error.message);
      return jsonResponse({ ok: false, error: 'Kaydedilemedi. Lütfen tekrar deneyin.' }, 503);
    }

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: false, error: 'Bilinmeyen adım.' }, 400);
}

export async function onRequest(context) {
  if (context.request.method.toUpperCase() !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  return onRequestPost(context);
}
