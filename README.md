# MEISTER KAFFEERÖSTEREI

B2B odaklı tek sayfalık kurumsal site + entegre yönetim paneli.
Cloudflare Pages + Pages Functions + KV üzerinde, sıfır bütçeli mimari.

- Mimari plan: [`plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md`](plan-design/plan/MEISTER-KAFFEE-ROESTEREI-Roadmap.md)
- Kod kuralları: [`CLAUDE.md`](CLAUDE.md)
- Onaylı tasarım: [`plan-design/design/`](plan-design/design/)

## Kurulum

```bash
npm install
cp .dev.vars.example .dev.vars     # değerleri doldur
```

### KV namespace'lerini oluştur (tek seferlik)

```bash
npx wrangler kv namespace create CONTENT_KV
npx wrangler kv namespace create CONTENT_KV --preview
npx wrangler kv namespace create ADMIN_KV
npx wrangler kv namespace create ADMIN_KV --preview
```

Çıktıdaki id değerlerini `wrangler.toml` içindeki yer tutuculara yaz.

### Başlangıç içeriğini ve admin kullanıcısını yaz

Üç ortam değişkeni gerekir. `PASSWORD_PEPPER`, Cloudflare Pages'teki değerle
**birebir aynı** olmalıdır — farklıysa üretilen hash ile giriş doğrulaması eşleşmez.

PowerShell (bash tarzı `VAR=deger komut` sözdizimi PowerShell'de çalışmaz):

```powershell
$env:ADMIN_EMAIL = "admin@meisterkaffee.com.tr"
$env:ADMIN_PASSWORD = "..."
$env:PASSWORD_PEPPER = "..."   # .dev.vars ve Pages ile aynı
npm run seed
```

Script sonunda KV'den geri okuma doğrulaması yapar; "doğrulandı" satırlarını
görmeden kurulumu tamamlanmış sayma.

## Geliştirme

```bash
npm run dev      # wrangler pages dev  → http://localhost:8788
```

## Yayına alma

```bash
npm run deploy
```

Production ortamında `ADMIN_EMAIL` ve `SESSION_SECRET` değerleri
Cloudflare Pages panelinde **Settings > Environment variables** altında
*Encrypt* işaretli olarak tanımlanmalıdır — repoya asla girmez.
