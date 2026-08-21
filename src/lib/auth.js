/**
 * auth.js — şifre hash'leme, session imzalama/doğrulama, cookie yardımcıları.
 *
 * Workers runtime'ında bcrypt/argon2 WASM bağımlılığı gerektirir; bu yüzden
 * Web Crypto API'nin yerel PBKDF2-SHA256'sı kullanılır (roadmap §4.1).
 * Üçüncü parti JWT kütüphanesi yoktur: token `payload.signature` biçiminde
 * base64url kodlu, HMAC-SHA256 ile imzalanmış kompakt bir dizedir.
 *
 * Bu modül hem Workers'ta hem Node'da (scripts/seed-kv.mjs) çalışır —
 * her ikisinde de globalThis.crypto.subtle mevcuttur.
 */

/**
 * İTERASYON SAYISI NEDEN 50.000?
 *
 * Cloudflare Workers ücretsiz planında istek başına CPU limiti ~10 ms'dir.
 * Ölçüm (production'da doğrulandı): 210.000 iterasyon her seferinde,
 * 150.000 her seferinde, 100.000 ise ~6 denemenin 1'inde CPU limitini aşıp
 * isteği düşürüyor (HTTP 500 / error 1101). 50.000 ise 8/8 sorunsuz.
 *
 * Roadmap §4.1 "≥100.000" diyordu; bu, aynı roadmap'in "sıfır bütçe =
 * ücretsiz plan" kararıyla fiilen çelişiyor. Düşen iterasyonu telafi etmek
 * için şifre, PBKDF2'den ÖNCE sunucu tarafındaki bir gizli anahtarla
 * (PASSWORD_PEPPER) HMAC'lenir — bkz. pepperPassword().
 */
const PBKDF2_ITERATIONS = 50000;

/** Bu değerin üstündeki kayıtlar Workers'ta CPU limitini aşar. */
export const MAX_SAFE_ITERATIONS = 60000;

const HASH_BYTES = 32;
const SALT_BYTES = 16;
export const ALGO = 'PBKDF2-SHA256+pepper';

export const SESSION_COOKIE = 'mk_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 saat

/* ---- base64url ----------------------------------------------------------- */

function toBase64Url(bytes) {
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

const encoder = new TextEncoder();

/* ---- Şifre --------------------------------------------------------------- */

/**
 * Şifreyi PBKDF2'ye vermeden önce sunucu tarafındaki gizli anahtarla HMAC'ler.
 *
 * "Pepper" tuzdan farklıdır: tuz KV'de şifreyle birlikte durur, pepper ise
 * yalnızca ortam değişkeninde (Pages encrypted env var) yaşar. Böylece KV
 * içeriği tek başına sızsa bile saldırgan sözlük denemesi YAPAMAZ — pepper'ı
 * bilmeden hiçbir aday şifreyi test edemez. Maliyeti mikrosaniyeler.
 */
async function pepperPassword(password, pepper) {
  if (!pepper) throw new Error('PASSWORD_PEPPER tanımlı değil');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(password));
  return new Uint8Array(sig);
}

/**
 * @param {string} password
 * @param {string} pepper PASSWORD_PEPPER
 * @param {string} [saltB64] mevcut kayıt doğrulanıyorsa onun tuzu
 * @returns {Promise<{passwordHash:string, salt:string, algo:string, iterations:number}>}
 */
export async function hashPassword(password, pepper, saltB64) {
  const salt = saltB64
    ? fromBase64Url(saltB64)
    : crypto.getRandomValues(new Uint8Array(SALT_BYTES));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    await pepperPassword(password, pepper),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );

  return {
    passwordHash: toBase64Url(new Uint8Array(bits)),
    salt: toBase64Url(salt),
    algo: ALGO,
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Şifreyi saklanan kimlik bilgisiyle karşılaştırır.
 * Karşılaştırma sabit zamanlıdır (timing attack yüzeyini kapatır).
 *
 * @throws {Error} kayıttaki iterasyon sayısı Workers CPU limitini aşacaksa —
 *   çağıran taraf bunu yakalayıp "yeniden seed gerekiyor" mesajı gösterir.
 */
export async function verifyPassword(password, credentials, pepper) {
  if (!credentials || !credentials.passwordHash || !credentials.salt) return false;

  const iterations = credentials.iterations || PBKDF2_ITERATIONS;

  if (iterations > MAX_SAFE_ITERATIONS) {
    const err = new Error(
      `Kayıtlı iterasyon sayısı (${iterations}) Workers CPU limitini aşıyor. ` +
      `scripts/seed-kv.mjs yeniden çalıştırılmalı.`
    );
    err.code = 'ITERATIONS_TOO_HIGH';
    throw err;
  }

  const salt = fromBase64Url(credentials.salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    await pepperPassword(password, pepper),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );

  return timingSafeEqual(toBase64Url(new Uint8Array(bits)), credentials.passwordHash);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---- Session token ------------------------------------------------------- */

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * @returns {Promise<string>} `payload.signature`
 */
export async function signSession(payload, secret) {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * İmzayı ve süreyi doğrular.
 * @returns {Promise<object|null>} geçerliyse payload, değilse null
 */
export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  let valid;
  try {
    const key = await hmacKey(secret);
    valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(body));
  } catch {
    return null;
  }
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number') return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;

  return payload;
}

/**
 * @param {string} email
 * @param {string} csrf CSRF token — oturuma bağlanır, admin-guard doğrular
 */
export function createSessionPayload(email, csrf) {
  const now = Math.floor(Date.now() / 1000);
  return { sub: email, csrf, iat: now, exp: now + SESSION_TTL_SECONDS };
}

/* ---- Cookie -------------------------------------------------------------- */

export function buildSessionCookie(token) {
  return (
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; ` +
    `Max-Age=${SESSION_TTL_SECONDS}`
  );
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function readCookie(request, name) {
  const header = request.headers.get('cookie');
  if (!header) return null;

  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/* ---- Brute-force kilidi -------------------------------------------------- */

export const LOCKOUT = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
};
