/**
 * build-showcase-photos.mjs — ana sayfanın en üstündeki vitrin görsellerini üretir.
 *
 * YEREL ARAÇ. Deploy hattının parçası DEĞİLDİR (projede build adımı yoktur);
 * ürettiği dosyalar commit'lenir ve GitHub → Pages üzerinden yayına çıkar.
 *
 * Akış:
 *   photos/showcase/*.jpg|jpeg|png|webp       (orijinaller — .gitignore'da, repoya girmez)
 *     → public/images/showcase/<slug>.webp      (2400x1350, 16:9, commit'lenir)
 *     → public/images/showcase/<slug>-1200.webp (mobil için küçük kopya)
 *     → src/lib/showcase-photos.js              (liste + boyutlar, commit'lenir)
 *
 * Sıra ve alt metin dosya adından gelir:
 *   "01 Kafede espresso servisi.jpg"  →  1. görsel, alt "Kafede espresso servisi"
 * Baştaki numara yalnızca sıralama içindir. Alt metin ekran okuyucuya okunur;
 * görseli tarif eden Türkçe bir ad verin.
 *
 * public/images/showcase/ klasörü TAMAMEN bu betiğe aittir: kaynağı silinen
 * görselin çıktısı da silinir. Klasöre elle dosya koyma.
 *
 * Çalıştırma:  npm run photos   (ürün fotoğraflarıyla birlikte)
 * Gereksinim:  sharp (şu an wrangler ile birlikte geliyor).
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../src/lib/validate.js';

const SRC = 'photos/showcase';
const OUT = 'public/images/showcase';
const MANIFEST = 'src/lib/showcase-photos.js';
const PUBLIC_PREFIX = '/images/showcase';

// 16:9'a "attention" ile kırpılır (konu ortada kalır); sayfadaki bant
// ekran oranına göre bunu CSS'te bir kez daha ortadan kırpar.
const WIDTH = 2400;
const HEIGHT = 1350;
const SMALL_WIDTH = 1200;
const SMALL_HEIGHT = 675;
const QUALITY = 78;

const INPUT_RE = /\.(jpe?g|png|webp)$/i;

/** "01 Kafede_espresso.jpg" → "Kafede espresso" */
function altFromFile(file) {
  return path
    .parse(file)
    .name.replace(/^\d+[\s._-]*/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function write(file, width, height, outFile) {
  return sharp(file)
    .rotate() // EXIF yönü
    .resize({ width, height, fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: QUALITY })
    .toFile(path.join(OUT, outFile));
}

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const sources = fs
  .readdirSync(SRC)
  .filter((f) => INPUT_RE.test(f))
  .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));

const photos = [];
const outputs = new Set();

for (const file of sources) {
  const alt = altFromFile(file);
  const slug = slugify(alt);
  if (!slug) {
    console.warn(`  ! ${file}: dosya adından alt metin çıkmadı, atlandı.`);
    continue;
  }
  if (outputs.has(`${slug}.webp`)) {
    console.warn(`  ! ${file}: "${alt}" adı başka bir görselle çakışıyor, atlandı.`);
    continue;
  }

  const large = `${slug}.webp`;
  const small = `${slug}-${SMALL_WIDTH}.webp`;
  outputs.add(large).add(small);

  const src = path.join(SRC, file);
  const info = await write(src, WIDTH, HEIGHT, large);
  const smallInfo = await write(src, SMALL_WIDTH, SMALL_HEIGHT, small);

  photos.push({
    id: slug,
    alt,
    src: `${PUBLIC_PREFIX}/${large}`,
    width: info.width,
    height: info.height,
    srcSmall: `${PUBLIC_PREFIX}/${small}`,
    widthSmall: smallInfo.width,
  });
  console.log(
    `  ✓ ${file}  →  ${large} (${Math.round(info.size / 1024)} KB) + ${small} (${Math.round(smallInfo.size / 1024)} KB)`
  );
}

// Kaynağı kalmamış eski çıktıları temizle
for (const file of fs.readdirSync(OUT)) {
  if (!outputs.has(file)) {
    fs.rmSync(path.join(OUT, file));
    console.log(`  - ${file} silindi (kaynağı yok)`);
  }
}

const manifest = `/**
 * OTOMATİK ÜRETİLDİ — elle düzenleme, \`npm run photos\` ile yeniden üret.
 * Kaynak: ${SRC}/ (bkz. scripts/build-showcase-photos.mjs)
 */
export const SHOWCASE_PHOTOS = ${JSON.stringify(photos, null, 2)};
`;
fs.writeFileSync(MANIFEST, manifest, 'utf8');

console.log(
  photos.length
    ? `\n  ${photos.length} vitrin görseli hazır. Commit'leyip push'la.\n`
    : `\n  ${SRC}/ boş — vitrin sitede gizli kalacak.\n`
);
