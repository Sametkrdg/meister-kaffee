/**
 * assets.js — statik varlık URL'lerine sürüm damgası ekler.
 *
 * NEDEN VAR: `public/_headers` CSS/JS'yi 1 gün, görselleri 30 gün cache'liyor
 * ve dosya adlarında içerik hash'i yok (projede build adımı olmadığı için
 * `main.a1b2c3.css` gibi adlar üretilemiyor). Sonuç: yeni bir deploy'dan sonra
 * hem Cloudflare kenar önbelleği hem de ZİYARETÇİNİN TARAYICISI eski dosyayı
 * servis etmeye devam ediyor.
 *
 * 22 Ağustos 2026'da ölçüldü: tasarım v3 deploy edildikten sonra HTML güncelken
 * /assets/main.css hâlâ eski sürümdü (cf-cache-status: HIT, Age: 82482 = ~23 saat).
 * Cloudflare purge'ü kenar önbelleğini temizler ama TARAYICI ÖNBELLEĞİNE
 * ULAŞAMAZ — logoyu bir kez indirmiş ziyaretçi 30 gün eski logoyu görürdü.
 *
 * Çözüm: HTML zaten her istekte sunucuda üretildiği için varlık URL'lerinin
 * sonuna `?v=<sürüm>` ekleniyor. Sürüm değişince URL değişir, hem CDN hem
 * tarayıcı yeni dosyayı ister. Uzun cache süreleri de böylece güvenle korunur.
 *
 * Sürüm kaynağı: Cloudflare Pages, deploy sırasında `CF_PAGES_COMMIT_SHA`
 * ortam değişkenini doldurur (doğrudan yükleme yapan projelerde wrangler bunu
 * yerel git deposundan gönderir — `wrangler pages deployment list` çıktısındaki
 * "Source" sütunu bu değerdir).
 */

/**
 * Ortam değişkeni okunamazsa kullanılacak sabit.
 *
 * DİKKAT: Buraya düşülüyorsa sürüm artık kendiliğinden değişmez. Elle
 * güncellenmediği sürece deploy'lar yine eski varlıkları servis eder.
 * Bu yüzden `_headers` içindeki süreler bilinçli olarak "sonsuz" değil;
 * en kötü senaryoda kendi kendine düzelsin diye sınırlı tutuldu.
 */
const FALLBACK_VERSION = '20260822';

/**
 * Deploy'a özgü sürüm dizesi üretir.
 *
 * @param {object} [env] Pages Functions ortam nesnesi
 * @returns {string} URL'de kullanılmaya uygun kısa sürüm damgası
 */
export function resolveAssetVersion(env) {
  const sha = env && env.CF_PAGES_COMMIT_SHA;

  // Yalnızca onaltılık commit sha kabul edilir; beklenmedik bir değer
  // URL'e sızıp cache anahtarını bozmasın.
  if (typeof sha === 'string' && /^[0-9a-f]{8,}$/i.test(sha)) {
    return sha.slice(0, 8).toLowerCase();
  }

  return FALLBACK_VERSION;
}

/**
 * Varlık yoluna sürüm sorgusu ekler.
 *
 * @param {string} path `/assets/main.css` gibi kök-göreli yol
 * @param {string} version resolveAssetVersion() çıktısı
 * @returns {string}
 */
export function asset(path, version) {
  return `${path}?v=${encodeURIComponent(version || FALLBACK_VERSION)}`;
}
