# MEISTER KAFFEERÖSTEREI
## Zero-Budget Architecture & Execution Roadmap (Cloudflare Pages + KV)

Prepared as a milestone-based build plan. Every locked requirement from the brief is treated as fixed and is not altered below; where an implementation detail was not specified (e.g. exact hashing algorithm, cookie format), a specific engineering decision is made and called out explicitly so nothing is left ambiguous.

---

## 0. Locked Requirements (restated, unchanged)

- **Hosting:** Cloudflare Pages, static generation + serverless edge integration.
- **Data persistence:** Cloudflare KV / JSON storage — no external database, zero budget.
- **Admin security:** Email/Password authentication gating `/admin` before any management tool is reachable.
- **One page, five sections:** Hero, Why Us, Services & Products, Contact, Marketplace links (Trendyol, Amazon).
- **Admin-manageable fields:** contact information, marketplace/social links, product list.
- **Advanced SEO control from the admin panel:** per-section/per-product Page Title, Meta Description, Open Graph image, and Schema.org / JSON-LD.
- **Design system carried forward from the approved concept:** dark charcoal/anthracite background (`#181513` / `#1D1916`), off-white text (`#F3EEE8`), bronze/metallic accent (`#C7A47A`), muted neutrals (`#D8D1C8`, `#948B81`, `#8A8078`), display typeface **Fraunces**, body/UI typeface **Inter** — Swiss-style grid, clean spacing, industrial-chic.

---

## 1. Tech Stack & Infrastructure Plan

| Layer | Decision | Why it fits "zero-budget" |
|---|---|---|
| Hosting/CDN | Cloudflare Pages | Free tier: unlimited requests & bandwidth |
| Compute | Cloudflare Pages Functions (Workers runtime, file-based routing under `/functions`) | Free tier: 100,000 requests/day |
| Data store | 2× Cloudflare KV namespaces — `CONTENT_KV` (public content + SEO docs) and `ADMIN_KV` (credentials, session/lockout state) | Free tier: 1 GB storage, 100k reads/day, 1k writes/day — orders of magnitude above a single-tenant B2B site's needs |
| Rendering strategy | **Edge SSR at the root route.** `functions/index.js` reads the current content + SEO documents from `CONTENT_KV` on every request and renders the full HTML server-side (not client-hydrated), so search engine crawlers always receive the fully populated page and meta tags reflect the latest admin edits without a rebuild. A static fallback snapshot is written at build time as a cold-start/outage safety net. | No build-and-redeploy step is needed every time an admin edits copy — this is what makes "dynamic content on a static host" actually work. |
| Auth | Email/Password verified against `ADMIN_KV`, session issued as a signed, HttpOnly cookie | No third-party auth SaaS, no cost |
| Domain/TLS | Cloudflare-managed DNS + automatic TLS on Pages | Included free with any Cloudflare Pages project |

**Explicit engineering decisions (not specified in the brief, decided here):**
- Password hashing: **PBKDF2-SHA256** via the Workers-native Web Crypto API (bcrypt/argon2 are not available in the Workers runtime without a WASM dependency, which adds risk for zero benefit at this scale).
- Session token: a compact **HMAC-SHA256 signed token** (`payload.signature`, base64url), *not* a third-party JWT library — keeps the admin auth dependency-free.
- Admin dashboard UI: **vanilla JS**, no framework build step — keeps the toolchain minimal and the deploy zero-config.

---

## 2. Project Structure & File Architecture

```
meister-kaffee-roesterei/
├── public/                          # static, unmodified assets
│   ├── fonts/                       # self-hosted Fraunces + Inter (woff2)
│   ├── images/                      # logomark, icon set, OG fallback image
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── templates/                   # server-rendered HTML template functions
│   │   ├── layout.js                # <head>/<body> shell, injects SEO block
│   │   ├── hero.js
│   │   ├── why-us.js
│   │   ├── services-products.js
│   │   ├── contact.js
│   │   └── admin/
│   │       ├── login.js
│   │       └── dashboard.js
│   ├── styles/
│   │   └── main.css                 # design tokens (see §0) + Swiss grid + responsive rules
│   ├── scripts/
│   │   ├── main.js                  # public site: mobile nav, smooth scroll, contact form fetch()
│   │   └── admin.js                 # dashboard: calls /api/admin/* , renders editors
│   └── lib/
│       ├── kv-schema.js             # typed read/write helpers for every KV document
│       ├── render.js                # combines templates + KV content into final HTML string
│       ├── seo.js                   # builds <title>/meta/OG/JSON-LD from stored SEO fields
│       ├── auth.js                  # password hashing, session sign/verify, cookie helpers
│       └── validate.js              # input validation/sanitization (contact form + admin forms)
├── functions/                       # Cloudflare Pages Functions (file-based routing)
│   ├── _middleware.js               # global: security headers, CSP
│   ├── index.js                     # GET /  → edge-SSR the one-pager
│   ├── api/
│   │   ├── contact.js               # POST /api/contact
│   │   └── admin/
│   │       ├── login.js             # POST /api/admin/login
│   │       ├── logout.js            # POST /api/admin/logout
│   │       ├── content.js           # GET/PUT /api/admin/content  (contact info, links, products)
│   │       ├── seo.js               # GET/PUT /api/admin/seo      (per-section SEO + JSON-LD)
│   │       └── password.js          # POST /api/admin/password   (iki adimli sifre degistirme)
│   └── admin/
│       ├── _middleware.js           # auth guard for everything under /admin/*
│       ├── login.js                 # GET /admin/login  → renders login screen
│       └── index.js                 # GET /admin        → renders dashboard shell
├── scripts/
│   └── seed-kv.mjs                  # one-time local script: hash initial admin password, seed both namespaces
├── wrangler.toml                    # KV namespace bindings, build output config, routes
├── package.json
├── .dev.vars.example                # local secret template (never committed with real values)
└── README.md
```

**Separation of concerns:** everything under `functions/admin/**` and `functions/api/admin/**` passes through `functions/admin/_middleware.js`, which is the single choke point that checks the session cookie before any admin HTML or admin API response is returned. The public route (`functions/index.js`) and the public API (`functions/api/contact.js`) never import or depend on the auth layer.

---

## 3. KV Data Model

**`CONTENT_KV`**

| Key | Shape |
|---|---|
| `content:hero` | `{ eyebrow, headline, subheadline, ctaLabel, ctaHref }` — `headline` satırları `\|` ile ayrılır, `*yıldız*` içindeki satır bronz vurgulanır (tasarım v2). `logoUrl` v2'de kaldırıldı: logomark artık nav'da sabittir. |
| `content:why-us` | `[ { icon, title, description } ]` |
| `content:products` | `[ { id, name, category, description, imageUrl, audience[], order } ]` |
| `content:contact` | `{ email, phone, address, coordinates, marketplaceLinks: { trendyol, amazon }, socialLinks: {...} }` — `coordinates` hero'nun sağ üst teknik etiketinde gösterilir (tasarım v2), boşsa etiket gizlenir. |
| `content:submission:{receivedAt}-{id}` | Her form kaydı KENDİ anahtarında: `{ id, name, company, email, phone, message, receivedAt, country }`. Gönderen özeti + 160 karakterlik önizleme ayrıca KV **metadata**'sına yazılır, panel listeyi tek `list` çağrısıyla çizer. **Değişiklik gerekçesi:** eskiden tek bir `content:submissions` dizisiydi ve her gönderimde liste baştan okunup yeniden yazılıyordu; 500 uzun kayıtta ölçülen maliyet ~7,7 ms olup Workers'ın ~10 ms CPU limitine dayanıyordu ve endpoint herkese açık olduğu için kasıtlı tetiklenebiliyordu. Artık yazma maliyeti kayıt sayısından bağımsız sabittir (1 yazma, 0 okuma).  Kayıtlar `expirationTtl` ile **30 gün** sonra otomatik silinir (KVKK saklama/imha kararı). |
| `content:meta` | `{ updatedAt, updatedBy }` — bumped on every admin write, used to drive `sitemap.xml` `lastmod` and cache invalidation |

**`ADMIN_KV`**

| Key | Shape |
|---|---|
| `admin:credentials` | `{ email, passwordHash, salt, algo: "PBKDF2-SHA256", iterations }` |
| `admin:lockout:{email}` | failed-attempt counter + timestamp, TTL-expiring key used for basic brute-force lockout |

**SEO documents (in `CONTENT_KV`, one per manageable unit):**

| Key pattern | Shape |
|---|---|
| `seo:home`, `seo:why-us`, `seo:services`, `seo:contact` | `{ pageTitle, metaDescription, ogTitle, ogDescription, ogImage, canonical, jsonLd }` |
| `seo:product:{id}` | same shape, `jsonLd` defaults to a `Product` schema pre-filled from the product's own fields |

---

## 4. Security Plan

1. **Hashing:** PBKDF2-SHA256, per-account random salt, high iteration count (≥100,000), computed with the Workers Web Crypto API — no plaintext password ever stored or logged.
2. **Session cookie:** HMAC-SHA256-signed token containing `{ sub: email, exp }`, delivered as `HttpOnly; Secure; SameSite=Strict`. Verified on every request to `/admin/*` and `/api/admin/*` inside `functions/admin/_middleware.js`.
3. **Brute-force protection:** `admin:lockout:{email}` counter in `ADMIN_KV`; N failed attempts within a window locks the account out for a cooldown period. (Cloudflare's dashboard-level Rate Limiting Rules can be layered on top later if the account moves off the free plan.)
   **Uygulanan ek katman (21 Ağustos 2026):** Cloudflare WAF rate limiting kuralı — `URI Path starts with /api/`, IP başına 5 istek / 10 saniye, aksiyon Block, süre 10 sn. Free planda period ve duration 10 saniyeye sabittir. Bu kural, KV yazma kotasının (1.000/gün) herkese açık uçlardan tüketilmesini de engeller — ki denetimde bu, iletişim formunu ve panel kaydetmeyi gün boyu bozabilecek en yüksek riskli bulguydu.
4. **CSRF:** same-site cookie policy plus a double-submit token on every admin `PUT`/`POST`.
5. **CSP & security headers:** set globally in `functions/_middleware.js` (`Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
6. **Input handling:** every field written through `/api/admin/content` or `/api/admin/seo` — and every public contact-form submission — passes through `src/lib/validate.js` before it is persisted or rendered, since content is injected server-side into HTML (stored-XSS prevention is mandatory here, not optional).
7. **Secrets:** `ADMIN_EMAIL` is set only as a Cloudflare Pages encrypted environment variable; `SESSION_SECRET` (HMAC key) likewise — neither ever committed to the repo. `.dev.vars` (local-only, gitignored) mirrors them for `wrangler pages dev`.

---

## 5. Phase-by-Phase Execution Roadmap

### Phase 1 — Setup & Environment
1. Initialize git repository, `package.json`, base `wrangler.toml`.
2. Create the Cloudflare Pages project and connect it to the repository (build command + output directory configured for the static shell).
3. Create the two KV namespaces (`CONTENT_KV`, `ADMIN_KV`) via `wrangler kv:namespace create`, bind both in `wrangler.toml` **and** in the Pages dashboard for both Production and Preview environments.
4. Run `scripts/seed-kv.mjs` locally to hash the chosen admin password and write the initial `admin:credentials` document into `ADMIN_KV`.
5. Seed `CONTENT_KV` with the initial real content documents (hero copy, Why Us items, product list, contact info, default SEO/JSON-LD per section).
6. Set `ADMIN_EMAIL` and `SESSION_SECRET` as encrypted Pages environment variables (Production); populate `.dev.vars` for local dev.
7. Confirm the local dev loop: `wrangler pages dev` serving `functions/` against the bound KV namespaces.
8. Point the custom domain at the Pages project (Cloudflare-managed DNS), confirm automatic TLS issuance.
9. Add `robots.txt` and a minimal `sitemap.xml` (single canonical URL, `Disallow: /admin`), placeholder Search Console verification.

### Phase 2 — Public Frontend (Dark Mode, Swiss Typography)
1. Implement design tokens in `src/styles/main.css`: color variables from §0, an 8-pt Swiss spacing scale, type scale for Fraunces (display) / Inter (body/UI).
2. Build `layout.js` — page shell with a `<head>` slot that `seo.js` fills from the current `seo:home` document.
3. Build the **Hero** template: large logo presentation, value-proposition headline, primary CTA button labeled **"Bizimle İletişime Geç"** anchored to `#contact`.
4. Build the **Why Us** template: CSS-grid layout reading `content:why-us`, minimalist inline-SVG icon set (roasting expertise, freshness, quality standards).
5. Build the **Services & Products** template: reads `content:products`, groups/filters by audience tag (cafés, hotels, restaurants), presents roasting-service offerings alongside bean SKUs.
6. Build the **Contact** section: form fields exactly `Name, Company Name, Email, Phone, Message` posting to `/api/contact`; clickable `tel:` / `mailto:` links sourced from `content:contact`; **Trendyol** and **Amazon** buttons sourced from `content:contact.marketplaceLinks`.
7. Implement `functions/index.js`: fetch all `content:*` and `seo:home` (+ visible `seo:product:{id}`) documents from `CONTENT_KV` in parallel, render the full HTML via `render.js`, set `Cache-Control` (short TTL + `stale-while-revalidate`).
8. Implement `functions/api/contact.js`: validate payload via `validate.js`, append to `content:submissions`, return a JSON success/error the client script surfaces inline.
9. Mobile-responsive pass across the Swiss grid breakpoints; run Lighthouse and target Performance/Accessibility/SEO/Best-Practices ≥ 95.
10. Progressive-enhancement JS (`main.js`): mobile nav toggle, smooth-scroll to `#contact`, form submit/error/success states, scroll-reveal transitions gated behind `prefers-reduced-motion`.

### Phase 3 — Protected Admin Panel
1. Implement `functions/admin/_middleware.js`: verify the session cookie's HMAC signature and expiry on every request under `/admin/*`; redirect to `/admin/login` if invalid or absent.
2. Implement `functions/admin/login.js` (GET): render the branded Email/Password login screen (reuses the dark/bronze design tokens).
3. Implement `functions/api/admin/login.js` (POST): look up `admin:credentials`, recompute the PBKDF2 hash and compare, check/update the `admin:lockout:{email}` counter, issue the signed session cookie on success.
4. Implement `functions/api/admin/logout.js`: clear the session cookie.
5. Implement `functions/admin/index.js`: render the dashboard shell (vanilla JS, calls the `/api/admin/*` JSON endpoints).
6. Dashboard screen — **Contact & Links editor**: form bound to `content:contact` (email, phone, address, Trendyol/Amazon URLs, social links), `PUT /api/admin/content`.
7. Dashboard screen — **Products manager**: list/add/edit/delete/reorder `content:products` entries (name, category, description, image URL, audience tags).
8. Dashboard screen — **Why Us editor**: icon selection + title/description per item.
9. Implement `functions/api/admin/content.js`: `GET` returns the current documents for the dashboard to populate; `PUT` validates and writes, and bumps `content:meta.updatedAt`.
10. Every write records `updatedAt` / `updatedBy` on `content:meta` for a lightweight audit trail.
11. Manual QA pass: full login → edit each editor → confirm the public page reflects the change on next request → logout.

### Phase 4 — Advanced SEO & Schema.org / JSON-LD Integration
1. Finalize the `seo:{sectionId}` / `seo:product:{id}` schema (§3): Page Title, Meta Description, OG Title/Description/Image, canonical URL, JSON-LD type + fields.
2. Implement `src/lib/seo.js`: maps each stored SEO document to `<title>`, meta description, Open Graph + Twitter Card tags, canonical `<link>`, and one or more `<script type="application/ld+json">` blocks.
3. Dashboard screen — **SEO editor**: per-section tabs (Home/Hero, Why Us, Services, Contact) plus one tab per product, with Title/Description fields, an OG image URL field, and live character-count guidance (title ≤ 60, description ≤ 160).
4. Dashboard — **JSON-LD advanced mode**: raw-JSON textarea override per section/product, client- and server-side JSON validation before save so a malformed edit can never break the live page.
5. Update `functions/index.js` to assemble the full JSON-LD payload: an `Organization`/`LocalBusiness` block for the company plus a `Product` block for every currently visible product.
6. Generate/refresh `sitemap.xml` with `lastmod` driven by `content:meta.updatedAt`.
7. Validate structured data with Google's Rich Results Test and the Open Graph debugger against the live URL.
8. Final Lighthouse pass (Performance / SEO / Best Practices / Accessibility) after all Phase 4 additions; fix any regression before sign-off.
9. **Launch checklist:** custom domain live over HTTPS; sitemap submitted in Search Console; seed admin password rotated to a real one via the dashboard; `.dev.vars` confirmed absent from the deployed environment; production secrets confirmed set only in the Pages dashboard.


> **Durum (24 Agustos 2026) — Faz 4 tamamlandi.**
> Yapilanlar: 1-6 maddeleri kodda; `functions/api/admin/seo.js` + panelde SEO
> sekmesi (bolum/urun alt sekmeleri, 60/160 karakter sayaci, JSON-LD ham
> duzenleme + canli dogrulama), `functions/api/admin/password.js` + HESAP
> sekmesi (roadmap cikis listesi madde 9: "sifre panelden degistirilebilsin").
> Olculen sonuclar: Lighthouse SEO/Erisilebilirlik/En-Iyi-Uygulamalar
> **100/100/100**, basarisiz denetim yok; JSON-LD yapisal dogrulamasi hatasiz.
>
> **Not (roadmap varsayimindan sapma):** site tek sayfa oldugu icin
> `seo:why-us` / `seo:services` / `seo:contact` / `seo:product:{id}`
> dokumanlarinin baslik ve aciklama alanlari sayfaya YANSIMAZ; bu
> dokumanlardan canliya cikan tek alan `jsonLd`'dir. Alanlar ileride bolumler
> kendi sayfalarina ayrilirsa diye korunuyor, panel bunu her sekmede yaziyor.
>
> **Kullaniciya kalan manuel adimlar:** Search Console'a sitemap gonderimi,
> Google Rich Results Test ve Open Graph debugger'in canli URL uzerinde
> calistirilmasi, HSTS preload listesine basvuru.

---

## 6. Milestone Summary

| Phase | Deliverable | Exit Criteria |
|---|---|---|
| 1 — Setup & Environment | Pages project + KV namespaces live, seeded, domain attached | `wrangler pages dev` runs locally against bound KV; production URL resolves over HTTPS |
| 2 — Public Frontend | Fully edge-rendered one-pager (Hero, Why Us, Services & Products, Contact, Marketplace links) | Lighthouse ≥ 95 across the board; content edits in KV appear on next page load with no redeploy |
| 3 — Admin Panel | `/admin` login + dashboard managing contact info, links, products | Unauthenticated request to any `/admin/*` or `/api/admin/*` route is rejected; authenticated edits persist and reflect on the public page |
| 4 — SEO & Schema | Per-section/product Title, Meta Description, OG image, JSON-LD, all admin-editable | Rich Results Test passes with no errors; OG debugger renders correct title/description/image for the shared URL |

---

## 7. Post-Launch Enhancements (optional, still zero-budget-compatible)

- **Cloudflare Turnstile** on the contact form for spam protection (free tier).
- A free-tier transactional email API to notify the team on new `content:submissions` entries, replacing manual KV log checks.
- **Cloudflare Images** as a paid upgrade path only if URL-based product imagery becomes a bottleneck — noted as future, not part of the zero-budget baseline.
