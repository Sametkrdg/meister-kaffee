/**
 * build-product-photos.mjs — "Ürünlerimiz" bölümünün fotoğraflarını üretir.
 *
 * YEREL ARAÇ. Deploy hattının parçası DEĞİLDİR (projede build adımı yoktur);
 * ürettiği dosyalar commit'lenir ve GitHub → Pages üzerinden yayına çıkar.
 *
 * Akış:
 *   photos/urunler/*.jpg|jpeg|png|webp   (orijinaller — .gitignore'da, repoya girmez)
 *     → public/images/urunler/<slug>.webp (en fazla 900px genişlik, commit'lenir)
 *     → src/lib/shop-photos.js            (liste + boyutlar, commit'lenir)
 *
 * Ürün adı DOSYA ADINDAN gelir, panel gerekmez:
 *   "01 Espresso Blend 250 g.jpg"  →  "Espresso Blend 250 g"
 * Baştaki numara yalnızca sıralama içindir ve ada yazılmaz. Alt çizgi
 * boşluğa çevrilir.
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
const MAX_WIDTH = 900;
const QUALITY = 80;

const INPUT_RE = /\.(jpe?g|png|webp)$/i;

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
  const info = await sharp(path.join(SRC, file))
    .rotate() // telefon fotoğraflarındaki EXIF yönünü uygula
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(path.join(OUT, outFile));

  photos.push({ name, src: `${PUBLIC_PREFIX}/${outFile}`, width: info.width, height: info.height });
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
    ? `\n  ${photos.length} fotoğraf hazır. Commit'leyip push'la.\n`
    : `\n  ${SRC}/ boş — "Ürünlerimiz" bölümü sitede gizli kalacak.\n`
);
