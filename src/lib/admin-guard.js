/**
 * admin-guard.js — admin yetkilendirmesinin TEK kaynağı.
 *
 * NEDEN BU DOSYA VAR:
 * Roadmap §2 ve CLAUDE.md, `functions/admin/_middleware.js`'in hem `/admin/*`
 * hem `/api/admin/*` için tek kontrol noktası olduğunu söylüyor. Pages
 * Functions'ta bu mümkün değildir: bir `_middleware.js` yalnızca kendi
 * klasörünün altındaki yolları sarar. `functions/admin/_middleware.js`
 * `/api/admin/*`'ı GÖRMEZ — o yollar korumasız kalırdı.
 *
 * Çözüm: iki ayrı middleware dosyası var (routing bunu zorunlu kılıyor) ama
 * ikisi de auth mantığını buradan alır. Yani "tek auth kontrol noktası"
 * kuralı korunur; tekrar eden auth kodu yazılmaz.
 *
 * Yeni bir admin route'u eklerken hiçbir şey yapmana gerek yok — ilgili
 * klasörün middleware'i onu otomatik sarar.
 */

import {
  SESSION_COOKIE,
  readCookie,
  verifySession,
} from './auth.js';

/** Oturum açmadan erişilebilmesi gereken yollar (giriş ekranı ve giriş API'si). */
const PUBLIC_PATHS = new Set(['/admin/login', '/api/admin/login']);

export const CSRF_COOKIE = 'mk_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * İsteğin geçerli bir admin oturumu taşıyıp taşımadığını çözer.
 * @returns {Promise<{ ok: true, session: object } | { ok: false, reason: string }>}
 */
export async function resolveSession(request, env) {
  const secret = env.SESSION_SECRET;

  // Secret tanımlı değilse auth'u AÇIK bırakmak yerine kapalı başarısız ol.
  if (!secret) return { ok: false, reason: 'no-secret' };

  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return { ok: false, reason: 'no-cookie' };

  const session = await verifySession(token, secret);
  if (!session) return { ok: false, reason: 'invalid' };

  return { ok: true, session };
}

export function isPublicAdminPath(pathname) {
  return PUBLIC_PATHS.has(pathname.replace(/\/+$/, '') || pathname);
}

/**
 * Durum değiştiren isteklerde CSRF kontrolü (double-submit).
 *
 * Token oturumun içine gömülüdür ve ayrıca JS'in okuyabildiği bir cookie
 * olarak verilir; başlıktaki değer oturumdakiyle birebir eşleşmelidir.
 * SameSite=Strict cookie ile birlikte iki katmanlı koruma sağlar.
 */
export function checkCsrf(request, session) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const header = request.headers.get(CSRF_HEADER);
  if (!header || !session || !session.csrf) return false;

  // Sabit zamanlı karşılaştırma
  if (header.length !== session.csrf.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ session.csrf.charCodeAt(i);
  return diff === 0;
}

export function generateCsrfToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** JS'in okuyabilmesi gerekir (HttpOnly DEĞİL) — token'ı başlığa o koyar. */
export function buildCsrfCookie(token, maxAge) {
  return `${CSRF_COOKIE}=${token}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearCsrfCookie() {
  return `${CSRF_COOKIE}=; Path=/; Secure; SameSite=Strict; Max-Age=0`;
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}
