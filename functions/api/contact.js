/**
 * POST /api/contact — public iletişim formu.
 *
 * Sıfır bütçe kısıtı gereği e-posta/CRM relay'i yoktur: gelen talepler
 * CONTENT_KV'ye kayıt başına bir anahtar (`content:submission:<tarih>-<id>`)
 * olarak yazılır ve admin panelinden okunur.
 *
 * Form JS olmadan da gönderilebildiği için (normal form POST'u), istemcinin
 * Accept başlığına göre ya JSON ya da yönlendirme döner.
 */

import { putSubmission } from '../../src/lib/kv-schema.js';
import { validateContactSubmission } from '../../src/lib/validate.js';
import { verifyTurnstile } from '../../src/lib/turnstile.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  let payload;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      payload = Object.fromEntries(await request.formData());
    }
  } catch {
    return respond({ ok: false, error: 'Form verisi okunamadı.' }, 400, wantsJson, request);
  }

  // Bot koruması, alan doğrulamasından ÖNCE çalışır: geçersiz bir istek için
  // boşuna doğrulama yapılmasın ve bot'a hangi alanın hatalı olduğu sızmasın.
  const turnstile = await verifyTurnstile(
    payload && (payload['cf-turnstile-response'] || payload.turnstileToken),
    env.TURNSTILE_SECRET_KEY,
    request.headers.get('cf-connecting-ip')
  );

  if (!turnstile.ok) {
    console.warn('[contact] Turnstile reddi:', turnstile.reason);

    const message =
      turnstile.reason === 'secret-missing'
        ? 'Sunucu yapılandırması eksik. Lütfen e-posta ile ulaşın.'
        : 'Güvenlik doğrulaması tamamlanamadı. Sayfayı yenileyip tekrar deneyin.';

    return respond({ ok: false, error: message }, 403, wantsJson, request);
  }

  const result = validateContactSubmission(payload);
  if (!result.ok) {
    return respond(
      { ok: false, error: 'Lütfen formu kontrol edin.', errors: result.errors },
      422,
      wantsJson,
      request
    );
  }

  const entry = {
    ...result.value,
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    // Spam incelemesi için kaba kaynak bilgisi (IP saklanmıyor).
    country: request.headers.get('cf-ipcountry') || null,
  };

  try {
    // Tek yazma, hiç okuma yok — maliyet kayıt sayısından bağımsız sabittir.
    await putSubmission(env.CONTENT_KV, entry);
  } catch (error) {
    console.error('[contact] KV yazma hatası:', error && error.message);
    return respond(
      { ok: false, error: 'Mesaj şu anda kaydedilemedi. Lütfen tekrar deneyin.' },
      503,
      wantsJson,
      request
    );
  }

  return respond(
    { ok: true, message: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.' },
    200,
    wantsJson,
    request
  );
}

/** Diğer metotlar için açık 405. */
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

function respond(body, status, wantsJson, request) {
  if (wantsJson) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  // JS'siz gönderimde ana sayfaya dönülür; sonuç query string'den okunur.
  const url = new URL(request.url);
  url.pathname = '/';
  url.search = body.ok ? '?gonderildi=1' : '?hata=1';
  url.hash = 'iletisim';
  return Response.redirect(url.toString(), 303);
}
