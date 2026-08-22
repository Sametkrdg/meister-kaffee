/**
 * build-logo.mjs — logo varlıklarını `meisterkaffee/*.svg` kaynaklarından üretir.
 *
 * TEK SEFERLİK YEREL ARAÇ. Deploy hattının parçası DEĞİLDİR; `wrangler pages
 * deploy` bu dosyayı hiç çalıştırmaz (projede build adımı yoktur). Ürettiği
 * PNG/JPG dosyaları public/images altında commit'lenir.
 *
 * Kaynak dosyalar:
 *   meisterkaffee/1.svg  amblem + "MEISTER" + "KAFFEE-RÖSTEREI" (tam kilit)
 *   meisterkaffee/2.svg  sadece amblem
 *
 * (Klasördeki 3.svg — sadece yazı, amblemsiz — kullanılmadığı için silindi.)
 *
 * 1.svg ve 2.svg'deki amblem aslında SVG'ye gömülü bir raster'dır: 907x1282
 * PNG + aynı boyutta siyah-beyaz maske. Görünür renk maskeden değil, ikinci
 * görselden gelir. Bu yüzden amblemi renklendirmek için gömülü ikinci
 * base64 bloğunu yeniden üretip yerine yazıyoruz.
 *
 * Renk kararı (müşteri onaylı, 22 Ağustos 2026): amblem monokrom mürekkebe
 * çevrilir — kahverengi kontur gider, çizgi/gövde/dolgu ton farkları korunur.
 *
 * Çalıştırma:  node scripts/build-logo.mjs
 * Gereksinim:  sharp (şu an wrangler ile birlikte geliyor; kaybolursa
 *              `npm i -D sharp` ile açıkça kurulmalıdır).
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const INK = [0x1c, 0x1b, 0x1a];
const PAPER = [0xfa, 0xf9, 0xf6];
const SRC = 'meisterkaffee';
const OUT = 'public/images';

const IMG_RE = /xlink:href="data:image\/(\w+);base64,([A-Za-z0-9+/=]+)"/g;

/** SVG'ye gömülü base64 görselleri sırayla döndürür (0 = maske, 1 = çizim). */
function embeddedImages(svg) {
  return [...svg.matchAll(IMG_RE)].map((m) => Buffer.from(m[2], 'base64'));
}

/**
 * Luminansı koruyarak tek renge indirger: en koyu uç mürekkebe, en açık uç
 * kâğıda oturur. Siluete çevirmez — konturlar, gövde grisi ve krem dolgular
 * birbirinden ayrılabilir kalır.
 */
function toMonochrome(raw, channels, count) {
  const out = Buffer.alloc(count * channels);
  for (let i = 0; i < count; i++) {
    const o = i * channels;
    const lum = (0.2126 * raw[o] + 0.7152 * raw[o + 1] + 0.0722 * raw[o + 2]) / 255;
    // Alt ucu 0.10'dan kesmek, kahverengi konturun gri değil mürekkep
    // koyuluğunda çıkmasını sağlar.
    const t = Math.min(1, Math.max(0, (lum - 0.1) / 0.88));
    for (let c = 0; c < 3; c++) out[o + c] = Math.round(INK[c] + (PAPER[c] - INK[c]) * t);
    if (channels === 4) out[o + 3] = raw[o + 3];
  }
  return out;
}

/** Gömülü çizim görselini monokrom sürümüyle değiştirilmiş SVG döndürür. */
async function inkedSvg(file) {
  const svg = fs.readFileSync(path.join(SRC, file), 'utf8');
  const [, art] = embeddedImages(svg);
  const { data, info } = await sharp(art).raw().toBuffer({ resolveWithObject: true });
  const mono = toMonochrome(data, info.channels, info.width * info.height);
  const png = await sharp(mono, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  // Yalnızca İKİNCİ görseli değiştir; birincisi maskedir ve siyah-beyaz kalmalı.
  let seen = 0;
  const swapped = svg.replace(IMG_RE, (m, fmt, b64) =>
    ++seen === 2 ? m.replace(b64, png.toString('base64')) : m
  );

  return (
    swapped
      // Kaynak SVG'ler tam sayfa beyaz bir <rect> ile başlar. Bırakılırsa logo
      // saydam olmaz ve kâğıt zemin üstünde daha parlak bir kutu olarak görünür.
      .replace(/<rect[^>]*fill="#ffffff"[^>]*\/>/gi, '')
      // Vektör yazıdaki kahverengi ("KAFFEE-RÖSTEREI") de mürekkebe çevrilir.
      .replace(/#40281c/gi, '#1C1B1A')
  );
}

/** Saydam kenar boşluklarını kırpar. */
async function trimTransparent(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * ch + 3] > 4) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('görsel tamamen saydam');
  return sharp(buf)
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .toBuffer();
}

const emblem = Buffer.from(await inkedSvg('2.svg'));
const lockup = Buffer.from(await inkedSvg('1.svg'));

// Amblem üç tondan (kontur / gövde / dolgu) ve bunların ara geçişlerinden
// oluşuyor; paletli PNG dosyayı görünür kayıp olmadan ~4 kat küçültüyor.
const PNG_OPTS = { compressionLevel: 9, palette: true };

// 1) logomark — menü ve panel için saydam, kırpılmış amblem
const mark = await trimTransparent(await sharp(emblem).resize({ height: 640 }).png().toBuffer());
fs.writeFileSync(path.join(OUT, 'logomark.png'), await sharp(mark).png(PNG_OPTS).toBuffer());

// 2) favicon — sekme arkaplanı koyu olabileceği için kâğıt zemine oturtulur
const faviconMark = await sharp(mark).resize({ height: 196, fit: 'inside' }).toBuffer();
await sharp({
  create: { width: 256, height: 256, channels: 4, background: { ...rgb(PAPER), alpha: 1 } },
})
  .composite([{ input: faviconMark, gravity: 'center' }])
  .png(PNG_OPTS)
  .toFile(path.join(OUT, 'favicon.png'));

// 3) logo-full — JSON-LD Organization.logo alanı için tam kilit.
// Kırpma logoyu piksel piksel sınıra dayadığı için nefes payı geri veriliyor;
// aksi halde "MEISTER"in son harfi görselin kenarına yapışık duruyor.
const full = await trimTransparent(await sharp(lockup).resize({ width: 1400 }).png().toBuffer());
const pad = Math.round((await sharp(full).metadata()).width * 0.07);
// sharp tek bir zincirde önce resize sonra extend uygular; boşluğu ayrı bir
// geçişte eklemezsek son genişlik istenen değeri aşar.
const padded = await sharp(full)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { ...rgb(PAPER), alpha: 1 } })
  .png()
  .toBuffer();
await sharp(padded)
  .resize({ width: 1000, fit: 'inside' })
  .flatten({ background: rgb(PAPER) })
  .png(PNG_OPTS)
  .toFile(path.join(OUT, 'logo-full.png'));

// 4) og-default — sosyal medya önizlemesi (WhatsApp, LinkedIn, X…).
// 1200x630 standart orandır; bundan sapan görselleri platformlar kırpar.
// Sayfadaki gibi kâğıt zemin + ince çerçeve, ortada tam kilit. Metin
// eklenmiyor: logo zaten marka adını ve alt başlığı taşıyor, ayrıca
// "çok yakında" gibi zamanla yanlışa düşen bir ibare bir daha girmesin.
const OG_W = 1200;
const OG_H = 630;
const frame = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">` +
    `<rect x="40.5" y="40.5" width="${OG_W - 81}" height="${OG_H - 81}" fill="none" ` +
    `stroke="#1C1B1A" stroke-opacity="0.14" stroke-width="1"/></svg>`
);
const ogLogo = await sharp(full).resize({ height: Math.round(OG_H * 0.56), fit: 'inside' }).toBuffer();
await sharp({
  create: { width: OG_W, height: OG_H, channels: 3, background: rgb(PAPER) },
})
  .composite([
    { input: frame, top: 0, left: 0 },
    { input: ogLogo, gravity: 'center' },
  ])
  .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
  .toFile(path.join(OUT, 'og-default.jpg'));

function rgb([r, g, b]) {
  return { r, g, b };
}

for (const f of ['logomark.png', 'favicon.png', 'logo-full.png', 'og-default.jpg']) {
  const p = path.join(OUT, f);
  const md = await sharp(p).metadata();
  console.log(`${f.padEnd(16)} ${md.width}x${md.height}  ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
}
