# CLAUDE.md

**MEISTER KAFFEERÖSTEREI** — B2B kahve kavurma markasının tek sayfalık sitesi +
yönetim paneli. Mimari plan: `plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md`
(çelişkide roadmap esastır, bu dosya güncellenir; roadmap §0'daki renkler eskidir).

## Yığın (değiştirmeden önce kullanıcıya sor)

- Cloudflare Pages + Pages Functions (`functions/`, dosya tabanlı routing) + KV
  (`CONTENT_KV` içerik/SEO, `ADMIN_KV` kimlik bilgisi/lockout). Sıfır bütçe:
  harici DB, auth SaaS, ücretli servis, framework, bundler **yok**.
- Ana sayfa (`functions/index.js`) her istekte KV'den okunup edge'de SSR edilir;
  client-side hydration yok.
- Frontend: vanilla HTML şablon fonksiyonları (`src/templates/`) + vanilla JS
  (progressive enhancement). Tarayıcıya giden CSS/JS `public/assets/`'tedir;
  `src/` yalnızca sunucu tarafıdır.
- Fontlar `public/fonts/`'ta self-host: Fraunces (başlık), Inter (gövde),
  Space Mono (nav, etiket, form).
- Yeni paket eklemeden önce dur ve sor.

## Ana sayfa sırası (müşteri kararı, 28 Ekim 2026)

`src/lib/render.js`:

1. **Vitrin** (`showcase.js`) — tam genişlik, animasyonlu sahne bandı,
   menünün ÜSTÜNDE. Görsel yoksa render edilmez.
2. **Menü** (`nav.js`) — vitrinin altında, sticky.
3. **Ürünlerimiz** (`shop.js`, `#urunler`)
4. **Hero** (`hero.js`) — "Zanaatkâr titizliğiyle kavrulmuş" başlığı, tek `<h1>`.
5. Marquee → Neden Biz → Hizmetler → Mağazalar → İletişim → footer.

Menü bağlantılarının sırası (`nav.js` `LINKS`) sayfa sırasını izler.

## Tasarım

Açık tema, palet **tamamen nötr** — kahverengi/bronz/bej yok; yeni renk için
kullanıcıya sor. Token'lar `public/assets/main.css` `:root`'tadır. Kurallar:

- Tüm metin tonları `#FAF9F6` üzerinde ≥ 4.5:1 kontrast. `--accent-mute`
  (3.96:1) yalnızca hero'daki dev başlık satırında.
- Vurgu = metin rengi, bu yüzden metin içi bağlantılar **altı çizili** olmalı
  (WCAG 1.4.1).
- Bölüm numaraları ve teknik etiketler (`01/`, `SEC/00`, `FIG.01`, `SCROLL`…)
  bilinçli olarak kaldırıldı; geri ekleme.
- Swiss grid, 12 sütun blueprint overlay, ince kenarlıklar, tek renk inline SVG.
- Tüm buton/CTA metinleri yalnızca Türkçe.

## Görseller (repoda, elle `public/` altına koyma)

| Bölüm | Kaynak (gitignore'da) | Çıktı | Liste |
|---|---|---|---|
| Vitrin | `photos/showcase/` | `public/images/showcase/` | `src/lib/showcase-photos.js` |
| Ürünlerimiz | `photos/urunler/` | `public/images/urunler/` | `src/lib/shop-photos.js` |

`npm run photos` ikisini de üretir; çıktı klasörleri ve liste dosyaları betiğe
aittir. Sıra dosya adındaki baştaki numaradır; vitrinde alt metin, üründe
varsayılan ad dosya adından gelir. Ürün ad/detay satırı `content:shop`'ta
(panel ÜRÜNLER sekmesi) durur ve `id` ile `kv-schema.mergeShop()`'ta birleşir.
Fotoğrafları KV'ye veya harici depoya taşıma.

**Vitrin sahneleri:** bir vitrin görselinin id'si `showcase.js` `SCENES`'te
varsa üstüne metin + dekupe paketler bindirilir, yoksa düz görsel gösterilir.
Dekupe paketler (`<slug>-paket.webp`, `shop-photos.js` `cutout`) ürün
betiğinin beyaz zeminli çekimlerden ürettiği saydam kopyalardır. Sahne
metinleri sitenin onaylı iddialarından alındı; yeni iddia için müşteriye sor.
Mevcut üç arka plan Unsplash fotoğrafıdır; müşterinin kendi çekimleri
geldiğinde aynı dosya adıyla değiştirilebilir. Animasyon süresi CSS'tedir
(`showcase-progress`, 7 sn); geçişi `animationend` tetikler.

## Kurallar

- **Auth yalnızca `src/lib/admin-guard.js`'te.** İki guard onu çağırır:
  `functions/admin/_middleware.js` (HTML → login) ve
  `functions/api/admin/_middleware.js` (JSON → 401 + CSRF). İkincisi silinirse
  admin API'leri korumasız kalır. Route dosyalarına auth kontrolü yazma.
- **Şifre:** düz metin asla loglanmaz/yazılmaz (yalnızca `passwordHash` + `salt`).
  PBKDF2 **50.000** iterasyon — Workers ~10 ms CPU limiti yüzünden artırılamaz;
  telafisi `PASSWORD_PEPPER` (yalnızca ortam değişkeni, değişirse seed yeniden
  çalışmalı). Şifre değiştirme iki istekte yapılır (`dogrula` → `uygula`);
  tek isteğe indirme.
- **Kullanıcı girdisi** (form + panel alanları) `src/lib/validate.js`'den
  geçmeden render'a veya KV'ye gitmez (stored-XSS).
- **Statik varlık URL'leri** `asset(path, assetVersion)` ile yazılır
  (`src/lib/assets.js`); dosya adlarında hash olmadığı için sürüm damgası
  olmadan tarayıcı önbelleği eski dosyayı tutar. İstisna: fontlar sürümsüz
  (preload ile CSS `url()` birebir aynı olmalı).
- **SEO** yalnızca `src/lib/seo.js`'ten üretilir. Site tek sayfa: canlıya
  yalnızca `seo:home` meta etiketleri çıkar; diğer `seo:*` dokümanlarından
  yalnızca `jsonLd` kullanılır (öncelik: `seo:home.jsonLd` tüm grafiği
  değiştirir → `seo:product:{id}` o ürünün bloğunu → bölüm `jsonLd`'leri
  eklenir). Paneldeki bu uyarıyı kaldırma.
- **Hız sınırı WAF'tadır:** `/api/*` için IP başına 5 istek / 10 sn (panel
  dahil). Panelde bir işlem tek istek atmalı; admin API'leri yazmadan sonra
  doğrulanmış veriyi döndürür, yeniden GET ekleme. 429 gövdesi JSON değildir
  (istemcide `describeError()`).
- **KV şeması** değişirse `src/lib/kv-schema.js` ve roadmap §3 birlikte güncellenir.
- **Trendyol linki** KV'de boşsa `kv-schema.withMarketplaceDefaults` koddaki
  varsayılanı kullanır; gizlemek için `DEFAULTS` içinden de silinmeli.

## Komutlar

```bash
npm run dev                      # wrangler pages dev
npm run deploy                   # wrangler pages deploy
npm run seed                     # admin + başlangıç içeriğini KV'ye yaz
npm run seed -- --sadece-sifre   # yalnızca admin şifresini sıfırla
npm run photos                   # vitrin + ürün görsellerini üret
node scripts/build-logo.mjs      # logo (yalnızca meisterkaffee/*.svg değişirse)
```

Build adımı yok. `scripts/` yerel araçlardır, deploy hattında değildir; görsel
betikleri `sharp` ister (wrangler ile geliyor; yoksa `npm i -D sharp`).

## PR öncesi kontrol

- [ ] Yeni admin endpoint'i ilgili `_middleware.js` klasörünün altında mı?
- [ ] Yeni form/alan `validate.js`'den geçiyor mu?
- [ ] Secrets (`SESSION_SECRET`, `PASSWORD_PEPPER`, `ADMIN_EMAIL`) yalnızca `.dev.vars`'ta mı?
- [ ] Yeni bir harici kaynak CSP'yi (`functions/_middleware.js`) bozuyor mu?
