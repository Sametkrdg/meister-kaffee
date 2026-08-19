/**
 * Global middleware — güvenlik header'ları ve CSP.
 *
 * DİKKAT: Yeni bir script/görsel kaynağı (CDN, analytics, gömülü içerik)
 * eklenirse CSP burada güncellenmelidir, aksi halde tarayıcı sessizce bloklar.
 * Şu an tüm varlıklar aynı origin'den servis edildiği için 'self' yeterlidir.
 */

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

export async function onRequest(context) {
  const response = await context.next();

  // Statik varlıkların (font/görsel) header'ları da buradan geçer; sadece
  // güvenlik başlıklarını ekliyoruz, Content-Type'a dokunmuyoruz.
  const headers = new Headers(response.headers);

  headers.set('Content-Security-Policy', CSP);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
