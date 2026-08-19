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

| Token | Değer | Kullanım |
|---|---|---|
| `--bg-primary` | `#181513` | Ana arkaplan (anthracite) |
| `--bg-secondary` | `#1D1916` | İkincil panel/kart arkaplanı |
| `--text-primary` | `#F3EEE8` | Ana metin (off-white) |
| `--accent-bronze` | `#C7A47A` | Bronz/metalik vurgu (CTA, ikonlar, çizgiler) |
| `--neutral-1..3` | `#D8D1C8`, `#948B81`, `#8A8078` | Yardımcı metin/border tonları |
| Display font | `Fraunces` | Başlıklar |
| Body font | `Inter` | Gövde metni, form, UI |

Swiss-style grid, bol beyaz alan (bronz vurgu dahil "boşluk" olarak sayılır), minimal ikon seti (inline SVG, tek renk).

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
  api/admin/*        login, logout, content, seo endpoint'leri
  admin/_middleware.js  /admin/* için auth guard — TEK auth kontrol noktası
scripts/seed-kv.mjs  yerel: admin şifresini hashleyip KV'yi ilk kez doldurur
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

# deploy
wrangler pages deploy
```

Build adımı yoktur (framework/bundler yok) — `wrangler pages dev` / `deploy` doğrudan `functions/` ve `public/` üzerinden çalışır.

## Kod Yazarken Kurallar

- **Auth kontrolünü asla `functions/admin/_middleware.js` dışına dağıtma.** Her yeni `/admin/*` veya `/api/admin/*` route'u otomatik olarak bu middleware'den geçer; ayrıca elle kontrol eklemeye gerek yok, tekrar eden auth kodu yazma.
- **Şifre asla düz metin olarak loglanmaz veya KV'ye yazılmaz.** Sadece `passwordHash` + `salt` saklanır (bkz. `admin:credentials` şeması).
- **Kullanıcı girdisi (contact formu + admin içerik alanları) `src/lib/validate.js`'den geçmeden render'a veya KV'ye yazılmaz.** İçerik server-side HTML'e enjekte edildiği için stored-XSS riski gerçektir, opsiyonel değildir.
- **SEO alanlarını (`seo:*` KV dokümanları) elle `functions/index.js` içine gömme** — her zaman `src/lib/seo.js` üzerinden üret, tek kaynak orası olsun.
- **KV şeması değişirse** (`content:*`, `seo:*`, `admin:*` anahtarları) hem `src/lib/kv-schema.js` hem de roadmap dosyasındaki §3 tablosu güncellenmeli — ikisi birbirinden sapmamalı.
- **Yeni bir bağımlılık/paket eklemeden önce dur:** proje sıfır bütçe + minimal toolchain prensibiyle kurulu; bir framework, ORM, veya ücretli SDK eklemek mimari kararı bozar.
- Tüm buton/CTA metinleri Türkçe kalmalı (örn. "Bizimle İletişime Geç") — marka kopyası çift dilli değildir, sadece Türkçe.

## Güvenlik Kontrol Listesi (her PR öncesi)

- [ ] `/admin` ve `/api/admin/*` altındaki her yeni endpoint middleware'den geçiyor mu?
- [ ] Yeni bir form/alan eklendiyse `validate.js`'den geçiyor mu?
- [ ] Secrets (`SESSION_SECRET`, `ADMIN_EMAIL`) repoya veya `.dev.vars` dışına commit edilmedi mi?
- [ ] CSP/security header'ları (`functions/_middleware.js`) yeni eklenen bir kaynak (script/img domaini) yüzünden bozulmadı mı?

## İlgili Dosyalar

- `plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md` — tam mimari plan, KV şeması, faz faz görev listesi. Bu dosyadaki her karar oradan türetilmiştir; çelişki olursa roadmap esas alınır ve bu dosya güncellenir.
