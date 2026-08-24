/**
 * kv-schema.js — CONTENT_KV / ADMIN_KV içindeki her dokümanın tek kaynağı.
 *
 * Roadmap §3'teki tabloyla birebir aynı kalmalıdır. Buradaki anahtarlar veya
 * şekiller değişirse roadmap §3 de güncellenir (bkz. CLAUDE.md kuralları).
 *
 * Varsayılan içerik, onaylanmış tasarımdaki metinlerden alınmıştır; ilk seed
 * bunları yazar, sonrasında admin panelinden düzenlenir.
 */

/* ---- Anahtarlar ---------------------------------------------------------- */

/** İletişim formu kayıtlarının anahtar öneki. */
export const SUBMISSION_PREFIX = 'content:submission:';

export const KEYS = {
  hero: 'content:hero',
  whyUs: 'content:why-us',
  products: 'content:products',
  contact: 'content:contact',
  meta: 'content:meta',

  /**
   * Her form kaydı KENDİ anahtarına yazılır.
   *
   * Eskiden tüm kayıtlar tek bir `content:submissions` listesindeydi ve her yeni
   * mesajda liste baştan okunup yeniden yazılıyordu. Bu, kayıt sayısı büyüdükçe
   * Workers'ın ~10 ms CPU limitine dayanıyordu (500 uzun mesajda ölçülen maliyet
   * ~7,7 ms) ve endpoint herkese açık olduğu için kasıtlı olarak da tetiklenebiliyordu.
   * Ayrı anahtarla yazma maliyeti kayıt sayısından bağımsız sabit kalır: 1 yazma, 0 okuma.
   *
   * ISO tarih öneki sayesinde anahtarlar leksikografik olarak eskiden yeniye sıralanır.
   */
  submission: (receivedAt, id) => `${SUBMISSION_PREFIX}${receivedAt}-${id}`,

  seo: (section) => `seo:${section}`,
  seoProduct: (id) => `seo:product:${id}`,

  credentials: 'admin:credentials',
  lockout: (email) => `admin:lockout:${email.toLowerCase()}`,
};

/** SEO dokümanı olan sabit bölümler (ürünler ayrıca seo:product:{id} taşır). */
export const SEO_SECTIONS = ['home', 'why-us', 'services', 'contact'];

/* ---- Varsayılan içerik --------------------------------------------------- */

export const DEFAULTS = {
  [KEYS.hero]: {
    eyebrow: 'KURUMSAL KAHVE ORTAĞINIZ',
    // Satırlar "|" ile ayrılır; *yıldız* içindeki satır soluk tonda vurgulanır.
    headline: 'ZANAATKÂR|*TİTİZLİĞİYLE*|KAVRULMUŞ',
    subheadline:
      'Oteller, kafeler ve ofisler için özel kavrulan, taze paketlenen ve titizlikle standartlaştırılan premium kahve çekirdekleri.',
    ctaLabel: 'BİZİMLE İLETİŞİME GEÇ',
    ctaHref: '#iletisim',
  },

  [KEYS.whyUs]: [
    {
      icon: 'roaster',
      title: 'Zanaatkâr Kavurma',
      description: 'Her parti, ustalarımız tarafından deneyim ve hassasiyetle kavrulur.',
    },
    {
      icon: 'clock',
      title: 'Tam Tazelik',
      description: 'Kavrulduktan sonra siparişinize göre paketlenir, asla stokta bekletilmez.',
    },
    {
      icon: 'check',
      title: 'Titiz Kalite Kontrolü',
      description: 'Her lot, kupalama ve laboratuvar testlerinden geçerek standardize edilir.',
    },
    {
      icon: 'leaf',
      title: 'Sürdürülebilir Tedarik',
      description: 'Doğrudan üretici ilişkileriyle izlenebilir ve etik kaynaklı çekirdekler.',
    },
  ],

  [KEYS.products]: [
    {
      id: 'toptan-tedarik',
      name: 'Çekirdek Kahve Tedariği',
      category: 'TOPTAN TEDARİK',
      description:
        'Kafeler, oteller ve ofisler için düzenli teslimat programlarıyla single-origin ve blend kahveler.',
      imageUrl: '',
      points: [
        'Single-origin ve özel blendler',
        'Esnek sipariş hacimleri',
        'Zamanında ve tutarlı teslimat',
      ],
      audience: ['kafe', 'otel', 'ofis'],
      order: 1,
      visible: true,
    },
    {
      id: 'private-label',
      name: 'Private Label Roasting',
      category: 'ÖZEL KAVURMA',
      description: 'Kendi markanız için özel kavrulmuş, özel ambalajlı kahve üretimi.',
      imageUrl: '',
      points: [
        'Markalı ambalaj tasarımı',
        'Kavurma profili özelleştirme',
        'Küçük ve büyük ölçekli üretim',
      ],
      audience: ['kafe', 'restoran'],
      order: 2,
      visible: true,
    },
    {
      id: 'barista-destek',
      name: 'Barista & Ekipman Desteği',
      category: 'DANIŞMANLIK',
      description:
        'Ekibinizin kahve kalitesini en üst seviyeye taşıması için eğitim ve teknik destek.',
      imageUrl: '',
      points: [
        'Barista eğitim programları',
        'Ekipman kurulum desteği',
        'Sürekli kalite danışmanlığı',
      ],
      audience: ['kafe', 'otel', 'restoran'],
      order: 3,
      visible: true,
    },
  ],

  [KEYS.contact]: {
    email: 'info@meisterkaffee.com.tr',
    phone: '+90 537 737 82 20',
    address: 'Yalova, Türkiye',
    // Hero'nun sağ üst teknik etiketinde gösterilir; boşsa etiket gizlenir.
    coordinates: '40.6550° N, 29.2769° E',
    marketplaceLinks: {
      trendyol: '',
      amazon: '',
    },
    socialLinks: {
      instagram: '',
      linkedin: '',
    },
  },

  [KEYS.meta]: {
    updatedAt: null,
    updatedBy: null,
  },
};

/** Bölüm/ürün SEO dokümanlarının varsayılanları. */
export const SEO_DEFAULTS = {
  home: {
    pageTitle: 'Meister Kaffee-Rösterei — Kurumsal Kahve Tedariği ve Özel Kavurma',
    metaDescription:
      'Oteller, kafeler ve ofisler için zanaatkâr titizliğiyle kavrulmuş premium kahve çekirdekleri, private label kavurma ve barista desteği.',
    ogTitle: 'Meister Kaffee-Rösterei',
    ogDescription:
      'İşletmeniz için taze kavrulmuş, titizlikle standartlaştırılan premium kahve çekirdekleri.',
    ogImage: '/images/og-default.jpg',
    canonical: '',
    jsonLd: null,
  },
  'why-us': {
    pageTitle: 'Neden Meister — Zanaatkâr Kavurma Standartları',
    metaDescription:
      'Her parti kalite kontrol sürecinden ve zanaatkâr kavurma standartlarından geçer. Tam tazelik, izlenebilir ve etik kaynaklı çekirdekler.',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
    jsonLd: null,
  },
  services: {
    pageTitle: 'Hizmetler ve Ürünler — Toptan Tedarik, Private Label, Barista Desteği',
    metaDescription:
      'Kafeler, oteller ve ofisler için toptan çekirdek kahve tedariği, markanıza özel kavurma ve barista eğitim programları.',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
    jsonLd: null,
  },
  contact: {
    pageTitle: 'İletişim — Kurumsal Teklif Alın',
    metaDescription:
      'Toptan tedarik, özel kavurma ve markalı ambalaj çözümleri için Meister Kaffee-Rösterei ekibiyle iletişime geçin.',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
    jsonLd: null,
  },
};

/**
 * Ürün SEO dokümanının boş şablonu.
 *
 * Ürünlerin başlık/açıklaması `content:products`'tan zaten geliyor; buradaki
 * alanlar yalnızca ARAMA MOTORU çıktısını özelleştirmek isteyen için var.
 * Hepsi boşsa `seo.js` ürünün kendi alanlarından otomatik Service şeması
 * üretir — yani bu doküman hiç oluşturulmasa da sayfa eksiksiz çalışır.
 */
export const SEO_PRODUCT_DEFAULT = {
  pageTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonical: '',
  jsonLd: null,
};

/**
 * Tek sayfalık sitede aynı anda kaç ürünün SEO dokümanı okunacağının sınırı.
 *
 * Workers ücretsiz planında istek başına 50 alt-istek var; ana sayfa zaten
 * 5 KV okuması yapıyor. Bu sınır, ürün listesi büyüdüğünde bütçenin sessizce
 * tükenmesini engeller.
 */
export const SEO_PRODUCT_READ_LIMIT = 20;

/* ---- Okuma / yazma yardımcıları ------------------------------------------ */

/**
 * KV'den JSON okur. Anahtar yoksa veya JSON bozuksa varsayılana düşer —
 * böylece boş bir namespace ile bile sayfa render edilebilir.
 */
export async function readDoc(kv, key, fallback = null) {
  try {
    const raw = await kv.get(key, { type: 'json' });
    if (raw === null || raw === undefined) {
      return fallback !== null ? fallback : structuredCloneSafe(DEFAULTS[key] ?? null);
    }
    return raw;
  } catch {
    return fallback !== null ? fallback : structuredCloneSafe(DEFAULTS[key] ?? null);
  }
}

export async function writeDoc(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
}

/**
 * Bölüm SEO dokümanlarını (home hariç) okur.
 *
 * Bunların yalnızca `jsonLd` alanı canlı sayfaya çıkar: site tek sayfa
 * olduğu için `<title>`/meta etiketleri sadece `seo:home`'dan üretilebilir
 * (bkz. src/lib/seo.js). Diğer alanlar bölümler ileride kendi sayfalarına
 * ayrılırsa kullanılmak üzere saklanır.
 */
export async function readSeoSections(kv) {
  const names = SEO_SECTIONS.filter((s) => s !== 'home');
  const docs = await Promise.all(
    names.map((s) => readDoc(kv, KEYS.seo(s), SEO_DEFAULTS[s] || SEO_PRODUCT_DEFAULT))
  );

  const out = {};
  names.forEach((name, i) => {
    out[name] = docs[i];
  });
  return out;
}

/** Verilen ürün id'leri için `seo:product:{id}` dokümanlarını okur. */
export async function readSeoProducts(kv, ids) {
  const wanted = (Array.isArray(ids) ? ids : []).filter(Boolean).slice(0, SEO_PRODUCT_READ_LIMIT);
  if (wanted.length === 0) return {};

  const docs = await Promise.all(
    wanted.map((id) => readDoc(kv, KEYS.seoProduct(id), SEO_PRODUCT_DEFAULT))
  );

  const out = {};
  wanted.forEach((id, i) => {
    out[id] = docs[i];
  });
  return out;
}

/**
 * Ana sayfanın ihtiyaç duyduğu tüm içerik dokümanlarını okur.
 *
 * KV okuma sayısı: 5 sabit + 3 bölüm SEO + görünür ürün sayısı. Bu maliyet
 * her ziyaretçide değil, PoP başına dakikada bir doğar: `functions/index.js`
 * HTML'i `s-maxage=60, stale-while-revalidate=600` ile servis eder.
 */
export async function readSiteContent(kv) {
  const [hero, whyUs, products, contact, seoHome, seoSections] = await Promise.all([
    readDoc(kv, KEYS.hero),
    readDoc(kv, KEYS.whyUs),
    readDoc(kv, KEYS.products),
    readDoc(kv, KEYS.contact),
    readDoc(kv, KEYS.seo('home'), SEO_DEFAULTS.home),
    readSeoSections(kv),
  ]);

  const visible = (Array.isArray(products) ? products : [])
    .filter((p) => p && p.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const seoProducts = await readSeoProducts(
    kv,
    visible.map((p) => p && p.id)
  );

  return { hero, whyUs, products: visible, contact, seo: seoHome, seoSections, seoProducts };
}

/* ---- İletişim formu kayıtları -------------------------------------------- */

/**
 * İletişim formu kayıtlarının saklama süresi: 30 gün.
 *
 * KVKK saklama/imha yükümlülüğü gereği belirlenmiştir (veri sorumlusunun
 * kararı, 21 Ağustos 2026). Süre sonunda kayıt Cloudflare tarafından
 * otomatik silinir — ayrı bir temizlik görevi veya cron gerekmez.
 * Aydınlatma metnindeki süre bu sabitle aynı kalmalıdır.
 */
export const SUBMISSION_TTL_DAYS = 30;
const SUBMISSION_TTL_SECONDS = SUBMISSION_TTL_DAYS * 24 * 60 * 60;

/**
 * Tek bir form kaydını yazar. 1 yazma, 0 okuma.
 *
 * Gönderenin özeti KV **metadata**'sına da konur (anahtar başına 1 KB sınırı).
 * Böylece panel listeyi tek bir `list` çağrısıyla çizebilir; mesaj gövdelerini
 * tek tek okumak gerekmez. Workers ücretsiz planında istek başına 50 alt-istek
 * sınırı olduğu için bu fark önemlidir.
 *
 * `expirationTtl` ile kayıt 30 gün sonra kendiliğinden silinir.
 */
export async function putSubmission(kv, entry) {
  const key = KEYS.submission(entry.receivedAt, entry.id);

  await kv.put(key, JSON.stringify(entry), {
    expirationTtl: SUBMISSION_TTL_SECONDS,
    metadata: {
      name: entry.name,
      company: entry.company,
      email: entry.email,
      phone: entry.phone,
      receivedAt: entry.receivedAt,
      country: entry.country,
      // Panel listesinde gösterilecek kısa önizleme (metadata 1 KB'ı aşmasın).
      preview: String(entry.message || '').slice(0, 160),
    },
  });

  return key;
}

/**
 * Kayıtları yeniden eskiye listeler. Gövdeler okunmaz — özet metadata'dan gelir.
 * @returns {Promise<{ items: object[], total: number }>}
 */
export async function listSubmissions(kv, limit = 100) {
  const keys = [];
  let cursor;

  do {
    const page = await kv.list({ prefix: SUBMISSION_PREFIX, cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);

  // Anahtar öneki ISO tarih: artan sıralama eskiden yeniye demektir.
  keys.reverse();

  const items = keys.slice(0, limit).map((k) => ({
    key: k.name,
    ...(k.metadata || {}),
  }));

  return { items, total: keys.length };
}

/** Tek bir kaydın tam gövdesini okur (panelde "tamamını gör" için). */
export async function readSubmission(kv, key) {
  if (typeof key !== 'string' || !key.startsWith(SUBMISSION_PREFIX)) return null;
  return kv.get(key, { type: 'json' });
}

/** Tek bir kaydı siler (KVKK silme talebi / panelden temizlik). */
export async function deleteSubmission(kv, key) {
  if (typeof key !== 'string' || !key.startsWith(SUBMISSION_PREFIX)) return false;
  await kv.delete(key);
  return true;
}

/** Her admin yazımından sonra çağrılır — sitemap lastmod ve denetim izi için. */
export async function touchMeta(kv, updatedBy) {
  const meta = { updatedAt: new Date().toISOString(), updatedBy: updatedBy ?? null };
  await writeDoc(kv, KEYS.meta, meta);
  return meta;
}

function structuredCloneSafe(value) {
  return value === null || value === undefined ? value : JSON.parse(JSON.stringify(value));
}
