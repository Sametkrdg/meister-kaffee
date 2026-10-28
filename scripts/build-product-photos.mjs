/**
 * build-product-photos.mjs — "Ürünlerimiz" bölümünün fotoğraflarını üretir.
 *
 * YEREL ARAÇ. Deploy hattının parçası DEĞİLDİR (projede build adımı yoktur);
 * ürettiği dosyalar commit'lenir ve GitHub → Pages üzerinden yayına çıkar.
 *
 * Akış:
 *   photos/urunler/*.jpg|jpeg|png|webp   (orijinaller — .gitignore'da, repoya girmez)
 *     → public/images/urunler/<slug>.webp (900x1125, 4:5 kırpılmış, commit'lenir)
 *     → public/images/urunler/<slug>-paket.webp (yalnızca beyaz zeminli
 *       çekimde: zemini silinmiş, saydam paket — vitrin sahnelerinde kullanılır)
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

// Dekupe paketin yüksekliği: vitrinde en fazla ~450px görünür, 2x ekran için 900.
const CUTOUT_HEIGHT = 900;
const CUTOUT_SUFFIX = '-paket';
// Bu değerin üstündeki pikseller zemin sayılır. Paketin kendisi ~230 tonunda,
// zemin saf beyaz (255); arada güvenli pay var.
const WHITE = 245;

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
    return { isPackshot, image: sharp(input.data).resize({
      width: WIDTH,
      height: HEIGHT,
      fit: 'cover',
      position: sharp.strategy.attention,
    }) };
  }

  const inner = await sharp(trimmed.data)
    .resize({
      width: Math.round(WIDTH * (1 - 2 * PACKSHOT_MARGIN)),
      height: Math.round(HEIGHT * (1 - 2 * PACKSHOT_MARGIN)),
      fit: 'inside',
    })
    .toBuffer({ resolveWithObject: true });

  const image = sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' } }).composite([
    {
      input: inner.data,
      left: Math.round((WIDTH - inner.info.width) / 2),
      top: Math.round((HEIGHT - inner.info.height) / 2),
    },
  ]);
  return { isPackshot, image };
}

/**
 * Beyaz zemini saydam yapar: kenarlardan başlayıp yalnızca KENARA BAĞLI
 * beyaz pikselleri siler (flood fill). Paketin içindeki beyaz alanlar
 * (etiket, logo boşluğu) kenara bağlı olmadığı için korunur.
 */
async function cutout(file) {
  const { data, info } = await sharp(file).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isWhite = (p) => data[p * 3] >= WHITE && data[p * 3 + 1] >= WHITE && data[p * 3 + 2] >= WHITE;

  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);

  while (stack.length) {
    const p = stack.pop();
    if (bg[p] || !isWhite(p)) continue;
    bg[p] = 1;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = bg[i] ? 0 : 255;
  }

  // Küçültme kenarı kendiliğinden yumuşatır; ayrıca bulanıklaştırma gerekmez.
  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
  return sharp(trimmed).resize({ height: CUTOUT_HEIGHT, withoutEnlargement: true });
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
  const { isPackshot, image } = await prepare(path.join(SRC, file));
  const info = await image.webp({ quality: QUALITY }).toFile(path.join(OUT, outFile));

  const photo = { id: slug, name, src: `${PUBLIC_PREFIX}/${outFile}`, width: info.width, height: info.height, cutout: null };
  console.log(`  ✓ ${file}  →  ${outFile}  (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`);

  if (isPackshot) {
    const cutFile = `${slug}${CUTOUT_SUFFIX}.webp`;
    const cut = await (await cutout(path.join(SRC, file)))
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(OUT, cutFile));
    photo.cutout = { src: `${PUBLIC_PREFIX}/${cutFile}`, width: cut.width, height: cut.height };
    used.add(`${slug}${CUTOUT_SUFFIX}`);
    console.log(`    + ${cutFile}  (${cut.width}x${cut.height}, ${Math.round(cut.size / 1024)} KB)`);
  }

  photos.push(photo);
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
