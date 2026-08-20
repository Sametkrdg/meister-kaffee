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

export const KEYS = {
  hero: 'content:hero',
  whyUs: 'content:why-us',
  products: 'content:products',
  contact: 'content:contact',
  submissions: 'content:submissions',
  meta: 'content:meta',

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
    // Satırlar "|" ile ayrılır; *yıldız* içindeki satır bronz vurgulanır.
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

/** Ana sayfanın ihtiyaç duyduğu tüm içerik dokümanlarını paralel okur. */
export async function readSiteContent(kv) {
  const [hero, whyUs, products, contact, seoHome] = await Promise.all([
    readDoc(kv, KEYS.hero),
    readDoc(kv, KEYS.whyUs),
    readDoc(kv, KEYS.products),
    readDoc(kv, KEYS.contact),
    readDoc(kv, KEYS.seo('home'), SEO_DEFAULTS.home),
  ]);

  const visible = (Array.isArray(products) ? products : [])
    .filter((p) => p && p.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return { hero, whyUs, products: visible, contact, seo: seoHome };
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
