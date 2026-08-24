# CLAUDE.md

Bu dosya, bu repoda çalışırken Claude Code (veya başka bir AI kod asistanı) için proje bağlamı ve kurallarını tanımlar. Buradaki kararlar `plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md` dosyasındaki mimari plana dayanır — o dosyadaki fazlar (Phase 1-4) uygulama sırasını belirler, burası ise günlük kod yazarken uyulacak kısa kural setidir.

## Proje Özeti

**MEISTER KAFFEE-RÖSTEREİ** — B2B odaklı, tek sayfalık, koyu temalı (dark mode) premium kahve kavurma markası web sitesi + entegre yönetim paneli. Sıfır bütçeli mimari: Cloudflare Pages + Cloudflare Pages Functions + Cloudflare KV. Harici veritabanı, harici auth servisi veya ücretli bir bileşen **yok**.

## Teknoloji Yığını (değiştirilemez kararlar)

- **Hosting/Deploy:** Cloudflare Pages
- **Sunucu tarafı mantık:** Cloudflare Pages Functions (`functions/` altında dosya tabanlı routing, Workers runtime)
- **Veri kalıcılığı:** Cloudflare KV — `CONTENT_KV` (herkese açık içerik + SEO dokümanları) ve `ADMIN_KV` (admin kimlik bilgileri + lockout sayaçları)
- **Render stratejisi:** Ana sayfa (`functions/index.js`) her istekte KV'den okuyup **edge'de server-side render** edilir. Statik build + client-side hydration YOK — SEO ve "admin panelden değişiklik anında yayında" gereksinimi bunu zorunlu kılıyor.
- **Auth:** Email/Password, `ADMIN_KV`'de PBKDF2-SHA256 hash, HMAC-SHA256 imzalı `HttpOnly; Secure; SameSite=Strict` session cookie. Üçüncü parti auth SaaS kullanılmaz.
- **Frontend:** Framework/build-step yok — vanilla HTML template fonksiyonları + vanilla JS (progressive enhancement). Admin dashboard da vanilla JS'tir.
- **Fontlar:** Fraunces (display/serif) + Inter (body/UI), `public/fonts/` altında self-host edilir — Google Fonts CDN'e runtime bağımlılığı yok.

Bu kararlardan biri değiştirilecekse (örn. bir framework eklemek, ücretli bir servise geçmek), önce kullanıcıya sorulmalı — sessizce varsayım yapılmamalı.

## Tasarım Token'ları (sabit — hardcode edilebilir CSS custom property olarak tutulmalı)

Palet **tamamen nötr**: kahverengi, bronz, bej veya başka bir renkli vurgu
kullanılmaz. Yeni bir renk eklemek gerekiyorsa önce kullanıcıya sorulmalıdır.

| Token | Değer | Kontrast¹ | Kullanım |
|---|---|---|---|
| `--bg-primary` | `#FAF9F6` | — | Ana arkaplan (kâğıt beyazı) |
| `--bg-secondary` | `#F2F1ED` | — | İkincil panel/kart arkaplanı |
| `--text-primary` | `#1C1B1A` | 16.33:1 | Ana metin (mürekkep) |
| `--accent` | `#1C1B1A` | 16.33:1 | Vurgu: CTA, ikon, çizgi (= mürekkep) |
| `--accent-hover` | `#4A4845` | 8.66:1 | Hover |
| `--accent-mute` | `#7E7C78` | 3.96:1 | **Yalnızca** hero'daki dev başlık satırı² |
| `--neutral-1..3` | `#3E3C3A`, `#55534F`, `#55534F` | 10.43 / 7.29 | Yardımcı metin tonları |
| `--text-lead` / `--text-body` | `#4A4845` | 8.66:1 | Hero alt metni / kart gövdesi |
| `--text-faint` | `#6B6965` | 5.20:1 | Küçük teknik etiketler, footer |
| `--accent-success` / `--accent-error` | `#2F6B3A` / `#A3271B` | 6.07 / 6.97 | Form geri bildirimi |
| `--line-*` | mürekkep %5 / %10 / %13 / %22 | — | blueprint ızgara → kart → pazaryeri kutusu |
| `--wash` / `--wash-strong` | mürekkep %3.5 / %6 | — | Hover ve focus dolgusu |
| `--gutter` | `8.5%` (≤900px: `7.5%`) | — | Sayfa kenar boşluğu; blueprint ızgara da bunu kullanır |
| Display font | `Fraunces` | — | Başlıklar (400-700, variable) |
| Body font | `Inter` | — | Gövde metni, form, UI (400-600, variable) |
| Mono font | `Space Mono` | — | Teknik etiket, nav, form alanları (400 + 700, **variable değil**) |

¹ `--bg-primary` üzerinde ölçülen WCAG kontrast oranı. Hepsi normal metin için
AA eşiğini (4.5:1) geçer. Yeni bir ton eklenirken bu eşik korunmalıdır.
² 3.96:1 yalnızca **büyük metin** eşiğini (3:1) geçer; normal boyutlu metinde
kullanılırsa erişilebilirlik bozulur.

Swiss-style grid, bol beyaz alan, minimal ikon seti (inline SVG, tek renk).

**Vurgu artık gövde metniyle aynı renk olduğu için** metin içindeki bağlantılar
yalnızca renkle ayırt edilemez (WCAG 1.4.1): hukuki metinler, footer ve form
aydınlatma satırındaki bağlantılar **altı çizili** olmak zorundadır.

**Tasarım v2 (20 Ağustos 2026):** üçüncü font ailesi (Space Mono), 12 sütunluk
*blueprint* ızgara overlay'i, belirgin kenarlıklar, sola hizalı dev hero
tipografisi + scroll parallax'ı, hero ile Neden Biz arasında kayan şerit
(marquee). Kaynak: `plan-design/design/`.

**Tasarım v3 (22 Ağustos 2026, müşteri isteği):** koyu tema açık temaya
çevrildi, kahverengi/bronz paletten tamamen çıkarıldı, kenar boşlukları
genişletildi ve **tüm bölüm numaraları ile teknik etiketler kaldırıldı**
(`01/ 02/ 03/ 04/`, `SEC/00`, `A0/A1…`, `SRV/00…`, `FIG.01`, `SCROLL`,
`SYSTEM ONLINE`). Bunları geri eklemeyin. Logo `meisterkaffee/*.svg`
kaynaklarından `scripts/build-logo.mjs` ile monokrom üretilir.

> Roadmap §0'daki renk listesi v1'e aittir (`#181513` / `#1D1916`); güncel değerler
> yukarıdaki tablodur.

## Dizin Yapısı

```
public/            statik varlıklar — Pages CDN'den doğrudan servis edilir
  fonts/            self-host Fraunces + Inter (woff2, latin + latin-ext)
  images/           logomark, logo-full, favicon, OG görseli
  assets/           main.css, main.js, admin.js  (tarayıcıya giden dosyalar)
  robots.txt
src/templates/      server-render HTML şablon fonksiyonları (hero, why-us, services-products, contact, admin/*)
src/lib/            kv-schema.js, render.js, seo.js, auth.js, validate.js
functions/          Cloudflare Pages Functions (routing = dosya yolu)
  index.js          GET /  → edge-SSR ana sayfa
  api/contact.js    POST /api/contact
  api/admin/*        login, logout, content, seo, password endpoint'leri
  admin/_middleware.js  /admin/* için auth guard — TEK auth kontrol noktası
scripts/seed-kv.mjs  yerel: admin şifresini hashleyip KV'yi ilk kez doldurur
scripts/build-logo.mjs yerel: meisterkaffee/*.svg → public/images/*.png|jpg (tek seferlik)
wrangler.toml        KV binding'leri, build config
```

> **Not (roadmap §2'den sapma, bilinçli):** Roadmap `main.css` / `main.js` / `admin.js` dosyalarını
> `src/styles/` ve `src/scripts/` altında gösterir. Projede build adımı olmadığı için `src/` altındaki
> hiçbir dosya tarayıcıya ulaşamaz — `src/` yalnızca Functions'ın import ettiği **sunucu tarafı**
> modülleri barındırır. Tarayıcıya gidecek CSS/JS bu yüzden `public/assets/` altındadır: Pages CDN'i
> bunları doğrudan, uzun cache ile ve Worker isteği harcamadan servis eder (günlük 100k istek limiti
> korunur). Stack kararlarının hiçbiri değişmedi.

## Komutlar

```bash
# yerel geliştirme (KV binding'leri wrangler.toml üzerinden bağlanır)
wrangler pages dev

# KV namespace oluşturma (tek seferlik)
wrangler kv:namespace create CONTENT_KV
wrangler kv:namespace create ADMIN_KV

# admin kullanıcısını / başlangıç içeriğini KV'ye yazma
node scripts/seed-kv.mjs

# logo varlıklarını yeniden üret (yalnızca logo kaynağı değişirse)
node scripts/build-logo.mjs

# deploy
wrangler pages deploy
```

Build adımı yoktur (framework/bundler yok) — `wrangler pages dev` / `deploy` doğrudan `functions/` ve `public/` üzerinden çalışır.
`scripts/` altındakiler deploy hattının parçası değildir; elle çalıştırılan yerel araçlardır.
`build-logo.mjs` `sharp`'a ihtiyaç duyar (şu an wrangler ile birlikte geliyor; kaybolursa `npm i -D sharp`).

## Kod Yazarken Kurallar

- **Auth mantığını `src/lib/admin-guard.js` dışına yazma.** Pages Functions'ta bir
  `_middleware.js` YALNIZCA kendi klasörünün altını sarar. Bu yüzden iki guard dosyası
  vardır — `functions/admin/_middleware.js` (`/admin/*`, HTML → login'e yönlendirir) ve
  `functions/api/admin/_middleware.js` (`/api/admin/*`, JSON → 401 + CSRF zorunlu).
  İkisi de kararı `admin-guard.js`'den alır, yani auth mantığı hâlâ tek yerdedir.
  **`functions/api/admin/_middleware.js` silinirse tüm admin API'leri korumasız kalır.**
  Yeni admin route'u eklerken ekstra bir şey yapmana gerek yok; ilgili klasörün
  middleware'i onu otomatik sarar. Route dosyasının içine auth kontrolü YAZMA.
- **Şifre asla düz metin olarak loglanmaz veya KV'ye yazılmaz.** Sadece `passwordHash` + `salt` saklanır (bkz. `admin:credentials` şeması).
- **PBKDF2 iterasyonu 50.000'dir ve artırılamaz.** Workers ücretsiz planında istek
  başına CPU limiti ~10 ms'dir; ölçüldü: 210.000 ve 150.000 her zaman, 100.000 ise
  ~6 istekte 1 kez limiti aşıp isteği düşürüyor (HTTP 500 / error 1101). 50.000
  güvenli paydadır. Roadmap §4.1'deki "≥100.000" bu yüzden geçersizdir —
  o değer aynı roadmap'in "sıfır bütçe" kararıyla çelişiyor.
  Düşen iterasyon **pepper** ile telafi edilir: şifre, PBKDF2'den önce
  `PASSWORD_PEPPER` ile HMAC'lenir. Pepper KV'de değil, yalnızca ortam
  değişkenindedir; KV sızsa bile sözlük denemesi yapılamaz.
  `PASSWORD_PEPPER` değişirse TÜM şifreler geçersiz olur, seed yeniden çalıştırılmalı.
- **Kullanıcı girdisi (contact formu + admin içerik alanları) `src/lib/validate.js`'den geçmeden render'a veya KV'ye yazılmaz.** İçerik server-side HTML'e enjekte edildiği için stored-XSS riski gerçektir, opsiyonel değildir.
- **Statik varlık URL'lerini şablonlara elle yazma — `src/lib/assets.js`'ten geçir.**
  `public/_headers` CSS/JS'yi 1 gün, görselleri 30 gün cache'liyor ve dosya
  adlarında içerik hash'i yok (build adımı olmadığı için üretilemiyor). Sürüm
  damgası olmadan yeni bir deploy yayına çıkmaz: 22 Ağustos 2026'da ölçüldü —
  HTML güncelken `/assets/main.css` hâlâ eskiydi (`cf-cache-status: HIT`,
  `Age: 82482`). Cloudflare purge'ü kenar önbelleğini temizler ama
  **tarayıcı önbelleğine ulaşamaz**; tek çözüm URL'in değişmesidir.
  Yeni bir CSS/JS/görsel referansı eklerken `asset(path, assetVersion)`
  kullan; `assetVersion` route'ta `resolveAssetVersion(env)` ile üretilir
  (kaynağı `CF_PAGES_COMMIT_SHA`).
  **Fontlar bilinçli olarak sürümsüzdür:** içerikleri değişmiyor ve
  `<link rel="preload">` ile CSS'teki `url()` birebir aynı olmalı, aksi halde
  font iki kez indirilir.
- **SEO alanlarını (`seo:*` KV dokümanları) elle `functions/index.js` içine gömme** — her zaman `src/lib/seo.js` üzerinden üret, tek kaynak orası olsun.
- **Site TEK SAYFA: yalnızca `seo:home`'un meta etiketleri yayına çıkar.**
  `seo:why-us`, `seo:services`, `seo:contact` ve `seo:product:{id}`
  dokümanlarından canlı sayfaya çıkan tek alan `jsonLd`'dir; başlık/açıklama
  alanları bölümler ileride kendi sayfalarına ayrılırsa kullanılmak üzere
  saklanır. Panel bunu her bölüm sekmesinde açıkça yazar — bu uyarıyı
  kaldırmayın, aksi halde yönetici yansımayan alanları doldurur.
  JSON-LD öncelik sırası: `seo:home.jsonLd` TÜM grafiği değiştirir →
  `seo:product:{id}.jsonLd` o ürünün bloğunun yerine geçer → bölüm
  dokümanlarının `jsonLd`'si grafiğe eklenir.
- **Şifre değiştirme İKİ istekte yapılır** (`functions/api/admin/password.js`):
  `dogrula` → `uygula`. Tek istekte hem doğrulama hem hash'leme 100.000
  PBKDF2 iterasyonu eder ve Workers CPU limitini ~6 istekte 1 aşar
  (bkz. PBKDF2 kuralı). Bunu tek adıma indirmeyin.
- **Admin API'leri yazma işleminden sonra DOĞRULANMIŞ veriyi geri döndürür**
  (`content` ve `seo` endpoint'leri). Panel bu yüzden kaydettikten sonra
  yeniden GET atmaz. Bu bir optimizasyon değil, hız sınırı gereğidir:
  ölçüldü — panel açılışı 1, SEO sekmesi 1, kaydetme 2 istek; toplam 4,
  WAF sınırı 5. Kaydetmeden sonra yeniden okuma eklerseniz sınır aşılır.
- **KV şeması değişirse** (`content:*`, `seo:*`, `admin:*` anahtarları) hem `src/lib/kv-schema.js` hem de roadmap dosyasındaki §3 tablosu güncellenmeli — ikisi birbirinden sapmamalı.
- **Yeni bir bağımlılık/paket eklemeden önce dur:** proje sıfır bütçe + minimal toolchain prensibiyle kurulu; bir framework, ORM, veya ücretli SDK eklemek mimari kararı bozar.
- **Hız sınırı Cloudflare WAF kuralındadır, kodda değil:** `/api/` ile başlayan tüm
  yollar için IP başına **5 istek / 10 saniye**, aksiyon Block, süre 10 sn.
  (Free planda period ve duration 10 saniyeye sabittir, değiştirilemez.)
  Bu kural admin panelini de kapsar — panelde bir işlem için birden fazla
  `/api/admin/*` isteği atmaktan kaçın (ör. silmeden sonra tüm içeriği yeniden
  çekme; yerel state güncelle). 429 yanıtı Worker'a ulaşmaz, gövdesi bizim JSON
  formatımızda değildir; istemci tarafında `describeError()` ile ele alınır.
- Tüm buton/CTA metinleri Türkçe kalmalı (örn. "Bizimle İletişime Geç") — marka kopyası çift dilli değildir, sadece Türkçe.

## Güvenlik Kontrol Listesi (her PR öncesi)

- [ ] `/admin` ve `/api/admin/*` altındaki her yeni endpoint middleware'den geçiyor mu?
- [ ] Yeni bir form/alan eklendiyse `validate.js`'den geçiyor mu?
- [ ] Secrets (`SESSION_SECRET`, `ADMIN_EMAIL`) repoya veya `.dev.vars` dışına commit edilmedi mi?
- [ ] CSP/security header'ları (`functions/_middleware.js`) yeni eklenen bir kaynak (script/img domaini) yüzünden bozulmadı mı?

## İlgili Dosyalar

- `plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md` — tam mimari plan, KV şeması, faz faz görev listesi. Bu dosyadaki her karar oradan türetilmiştir; çelişki olursa roadmap esas alınır ve bu dosya güncellenir.
