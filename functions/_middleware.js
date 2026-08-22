/**
 * Global middleware — güvenlik header'ları ve CSP.
 *
 * DİKKAT: Yeni bir script/görsel kaynağı (CDN, analytics, gömülü içerik)
 * eklenirse CSP burada güncellenmelidir, aksi halde tarayıcı sessizce bloklar.
 * Şu an tüm varlıklar aynı origin'den servis edildiği için 'self' yeterlidir.
 */

// Turnstile (bot koruması) kendi origin'inden script yükler ve bir iframe açar;
// doğrulama çağrılarını da oraya yapar. Bu üç izin olmadan widget sessizce
// bloklanır ve iletişim formu gönderilemez hâle gelir.
const TURNSTILE = 'https://challenges.cloudflare.com';

const CSP = [
  "default-src 'self'",
  `script-src 'self' ${TURNSTILE}`,

  // style-src'de 'unsafe-inline' NEDEN var:
  // Turnstile'ın scripti widget kapsayıcısına inline style uyguluyor ve
  // `style-src 'self'` bunu blokluyordu (tarayıcı konsolu: "Applying inline
  // style violates ... The action has been blocked"). Hash ile çözmek mümkün
  // değil: inline style ATTRIBUTE'ları için hash ancak 'unsafe-hashes' ile
  // çalışır ve hash Turnstile her güncellendiğinde sessizce bozulur — yani
  // iletişim formu bir gün habersiz çalışmayı bırakırdı.
  //
  // Riski sınırlı: yalnızca STİL gevşetildi, `script-src` sıkı kaldı.
  // CSS tabanlı sızdırma ancak saldırgan sayfaya HTML enjekte edebilirse
  // anlam kazanır; o yol validate.js'teki kaçış ile kapalı (denetimde
  // canlı payload'larla doğrulandı).
  "style-src 'self' 'unsafe-inline'",

  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
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
