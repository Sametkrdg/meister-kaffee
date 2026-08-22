/**
 * turnstile.js — Cloudflare Turnstile (bot koruması) için tek kaynak.
 *
 * NEDEN: WAF hız sınırı (IP başına 5 istek/10 sn) yalnızca seri istekleri keser.
 * Dakikada bir mesaj atan bir bot o kurala hiç takılmaz — nitekim 21 Ağustos
 * 2026'da iletişim formuna gerçek bir spam kaydı düştü. Turnstile bu boşluğu
 * kapatır.
 *
 * Sitekey herkese açıktır (HTML'e gömülür); gizli olan yalnızca
 * TURNSTILE_SECRET_KEY ortam değişkenidir.
 *
 * DİKKAT: Turnstile ayrı bir origin'den script + iframe yükler. CSP'de
 * `challenges.cloudflare.com` izinli olmalıdır — bkz. functions/_middleware.js.
 */

export const TURNSTILE_SITEKEY = '0x4AAAAAAEYUaOZgbT_4eSkZ';

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Tarayıcıdan gelen Turnstile token'ını Cloudflare'e doğrulatır.
 *
 * @param {string} token  form ile gelen `cf-turnstile-response`
 * @param {string} secret TURNSTILE_SECRET_KEY
 * @param {string} [remoteIp] CF-Connecting-IP (opsiyonel, doğruluğu artırır)
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function verifyTurnstile(token, secret, remoteIp) {
  if (!secret) return { ok: false, reason: 'secret-missing' };
  if (!token || typeof token !== 'string') return { ok: false, reason: 'token-missing' };

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (remoteIp) form.append('remoteip', remoteIp);

  let data;
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form });
    data = await res.json();
  } catch (error) {
    // Doğrulama servisine ulaşılamadıysa isteği reddet: açık bırakmak,
    // korumayı kapatmak demek olurdu.
    console.error('[turnstile] doğrulama isteği başarısız:', error && error.message);
    return { ok: false, reason: 'verify-unreachable' };
  }

  if (data && data.success === true) return { ok: true };

  return {
    ok: false,
    reason: Array.isArray(data && data['error-codes']) ? data['error-codes'].join(',') : 'failed',
  };
}
