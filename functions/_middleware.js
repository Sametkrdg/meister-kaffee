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
  // `preload` token'ı listeye başvuru için ÖN KOŞULDUR, tek başına bir etkisi
  // yoktur ve istendiğinde geri alınabilir. Asıl geri dönüşü zor adım domain'i
  // hstspreload.org'a göndermektir (listeden çıkmak aylar sürer).
  // Ön koşullar 21 Ağustos 2026'da doğrulandı: apex ve www'de HTTP→HTTPS 301,
  // max-age 1 yıl, includeSubDomains açık, www dışında alt alan adı yok.
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Cross-origin izolasyonu: pencere referansı ve kaynak gömülmesi kapalı.
  // Site hiçbir yere popup açmıyor ve varlıklarının başka sitelerde gömülmesi
  // beklenmiyor; sosyal medya og:image'ı sunucu tarafı çektiği için CORP'tan
  // etkilenmez (CORP yalnızca tarayıcıdaki alt-kaynak yüklemelerinde geçerli).
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
