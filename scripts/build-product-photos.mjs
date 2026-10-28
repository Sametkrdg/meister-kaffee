/**
 * build-product-photos.mjs — "Ürünlerimiz" bölümünün fotoğraflarını üretir.
 *
 * YEREL ARAÇ. Deploy hattının parçası DEĞİLDİR (projede build adımı yoktur);
 * ürettiği dosyalar commit'lenir ve GitHub → Pages üzerinden yayına çıkar.
 *
 * Akış:
 *   photos/urunler/*.jpg|jpeg|png|webp   (orijinaller — .gitignore'da, repoya girmez)
 *     → public/images/urunler/<slug>.webp (900x1125, 4:5 kırpılmış, commit'lenir)
 *     → src/lib/shop-photos.js            (liste + boyutlar, commit'lenir)
 *
 * Ürünün VARSAYILAN adı ve kimliği (id = slug) dosya adından gelir:
 *   "01 Espresso Blend 250 g.jpg"  →  id "espresso-blend-250-g", ad "Espresso Blend 250 g"
 * Baştaki numara yalnızca sıralama içindir ve ada yazılmaz. Alt çizgi
 * boşluğa çevrilir. Ad ve detay satırı panelden (ÜRÜNLER sekmesi,
 * `content:shop`) değiştirilebilir; panel kaydı id ile eşleşir. Bu yüzden
 * dosya adı değişirse id de değişir ve paneldeki ad o fotoğrafa uygulanmaz.
 *
 * public/images/urunler/ klasörü TAMAMEN bu betiğe aittir: kaynağı silinen
 * fotoğrafın çıktısı da silinir. Klasöre elle dosya koyma.
 *
 * Çalıştırma:  npm run photos
 * Gereksinim:  sharp (şu an wrangler ile birlikte geliyor; kaybolursa
 *              `npm i -D sharp` ile açıkça kurulmalıdır).
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../src/lib/validate.js';

const SRC = 'photos/urunler';
const OUT = 'public/images/urunler';
const MANIFEST = 'src/lib/shop-photos.js';
const PUBLIC_PREFIX = '/images/urunler';

// Kart masaüstünde ~300-400px; 900px 2x ekranlarda da net, dosya küçük kalır.
// Oran kartla (.shop-card__media, 4:5) aynı olmalı.
const WIDTH = 900;
const HEIGHT = 1125;
const QUALITY = 80;

const INPUT_RE = /\.(jpe?g|png|webp)$/i;

// Beyaz zeminli stüdyo çekiminde paketin kadrajda bırakılacak kenar payı
// (her yönde, kart boyutuna oranla) ve "stüdyo çekimi" sayılma eşiği.
const PACKSHOT_MARGIN = 0.1;
const PACKSHOT_MIN_TRIM = 0.25; // beyaz kenar alanın en az %25'iyse

/**
 * Fotoğrafı 4:5 karta hazırlar.
 *
 * Beyaz zeminli stüdyo çekimi (packshot): paket kadrajın küçük bir kısmını
 * kaplıyor ve bir yana yaslı olabiliyor; olduğu gibi kırpılınca kartta küçük
 * kalıyordu (28 Ekim 2026 geri bildirimi). Beyaz kenar kırpılır, paket eşit
 * kenar payıyla beyaz zemine ortalanır.
 *
 * Diğer fotoğraflar: kenarı kırpılacak beyaz zemin yok; "attention" ile en
 * dikkat çeken bölge (ürün) ortalanarak 4:5'e kırpılır.
 */
async function prepare(file) {
  const input = await sharp(file).rotate().toBuffer({ resolveWithObject: true }); // EXIF yönü
  const area = input.info.width * input.info.height;

  let trimmed = null;
  try {
    trimmed = await sharp(input.data)
      .trim({ background: '#ffffff', threshold: 30 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    trimmed = null; // kırpılacak kenar yok
  }

  const isPackshot = trimmed && 1 - (trimmed.info.width * trimmed.info.height) / area >= PACKSHOT_MIN_TRIM;

  if (!isPackshot) {
    return sharp(input.data).resize({
      width: WIDTH,
      height: HEIGHT,
      fit: 'cover',
      position: sharp.strategy.attention,
    });
  }

  const inner = await sharp(trimmed.data)
    .resize({
      width: Math.round(WIDTH * (1 - 2 * PACKSHOT_MARGIN)),
      height: Math.round(HEIGHT * (1 - 2 * PACKSHOT_MARGIN)),
      fit: 'inside',
    })
    .toBuffer({ resolveWithObject: true });

  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } }).composite([
    {
      input: inner.data,
      left: Math.round((WIDTH - inner.info.width) / 2),
      top: Math.round((HEIGHT - inner.info.height) / 2),
    },
  ]);
}

/** "01 Espresso_Blend 250 g.jpg" → "Espresso Blend 250 g" */
function nameFromFile(file) {
  return path
    .parse(file)
    .name.replace(/^\d+[\s._-]*/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const sources = fs
  .readdirSync(SRC)
  .filter((f) => INPUT_RE.test(f))
  .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));

const photos = [];
const used = new Set();

for (const file of sources) {
  const name = nameFromFile(file);
  if (!name) {
    console.warn(`  ! ${file}: dosya adından ürün adı çıkmadı, atlandı.`);
    continue;
  }

  const slug = slugify(name);
  if (used.has(slug)) {
    console.warn(`  ! ${file}: "${name}" adı başka bir fotoğrafla çakışıyor, atlandı.`);
    continue;
  }
  used.add(slug);

  const outFile = `${slug}.webp`;
  const info = await (await prepare(path.join(SRC, file)))
    .webp({ quality: QUALITY })
    .toFile(path.join(OUT, outFile));

  photos.push({ id: slug, name, src: `${PUBLIC_PREFIX}/${outFile}`, width: info.width, height: info.height });
  console.log(`  ✓ ${file}  →  ${outFile}  (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`);
}

// Kaynağı kalmamış eski çıktıları temizle
for (const file of fs.readdirSync(OUT)) {
  if (!used.has(path.parse(file).name)) {
    fs.rmSync(path.join(OUT, file));
    console.log(`  - ${file} silindi (kaynağı yok)`);
  }
}

const manifest = `/**
 * OTOMATİK ÜRETİLDİ — elle düzenleme, \`npm run photos\` ile yeniden üret.
 * Kaynak: ${SRC}/ (bkz. scripts/build-product-photos.mjs)
 */
export const SHOP_PHOTOS = ${JSON.stringify(photos, null, 2)};
`;
fs.writeFileSync(MANIFEST, manifest, 'utf8');

console.log(
  photos.length
    ? `\n  ${photos.length} fotoğraf hazır. Commit'leyip push'la; ad/detay panelin ÜRÜNLER sekmesinden değişir.\n`
    : `\n  ${SRC}/ boş — "Ürünlerimiz" bölümü sitede gizli kalacak.\n`
);
