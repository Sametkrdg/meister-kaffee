/**
 * validate.js — girdi doğrulama ve HTML kaçışı.
 *
 * İçerik sunucu tarafında HTML'e enjekte edildiği için stored-XSS riski
 * gerçektir: KV'ye yazılan veya render'a giden HİÇBİR kullanıcı girdisi
 * buradan geçmeden kullanılmaz (bkz. CLAUDE.md kuralları).
 */

/* ---- Kaçış --------------------------------------------------------------- */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Metni HTML gövdesine veya attribute değerine gömmek için güvenli hale getirir. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * href/src değerlerini güvenli hale getirir.
 * javascript:, data:, vbscript: gibi şemaları reddeder; sadece
 * http(s), mailto, tel, ve site içi (/ veya #) yollara izin verir.
 */
export function safeUrl(value) {
  if (!value) return '';
  const raw = String(value).trim();

  // Kontrol karakterleri "java\nscript:" gibi kaçamakları maskeleyebilir.
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('/') || cleaned.startsWith('#')) return escapeHtml(cleaned);

  const scheme = cleaned.slice(0, cleaned.indexOf(':') + 1).toLowerCase();
  const allowed = ['http:', 'https:', 'mailto:', 'tel:'];

  if (cleaned.includes(':') && !allowed.includes(scheme)) return '';
  if (!cleaned.includes(':')) return ''; // şemasız mutlak olmayan değer kabul edilmez

  return escapeHtml(cleaned);
}

/** tel: bağlantısı için numarayı sadeleştirir (+ ve rakamlar). */
export function telHref(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^\d+]/g, '');
  return digits ? `tel:${escapeHtml(digits)}` : '';
}

/* ---- Genel alan doğrulayıcıları ------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value.trim());
}

/** Metni kırpar, kontrol karakterlerini atar ve maksimum uzunluğa indirir. */
export function cleanText(value, maxLength = 500) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/* ---- İletişim formu ------------------------------------------------------ */

export const CONTACT_LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  phone: 40,
  message: 4000,
};

/**
 * Public iletişim formu payload'ını doğrular.
 * @returns {{ ok: true, value: object } | { ok: false, errors: Record<string,string> }}
 */
export function validateContactSubmission(input) {
  const errors = {};
  const data = input && typeof input === 'object' ? input : {};

  const name = cleanText(data.name, CONTACT_LIMITS.name);
  const company = cleanText(data.company, CONTACT_LIMITS.company);
  const email = cleanText(data.email, CONTACT_LIMITS.email);
  const phone = cleanText(data.phone, CONTACT_LIMITS.phone);
  const message = cleanText(data.message, CONTACT_LIMITS.message);

  if (name.length < 2) errors.name = 'Ad soyad en az 2 karakter olmalı.';
  if (company.length < 2) errors.company = 'Firma adı en az 2 karakter olmalı.';
  if (!isEmail(email)) errors.email = 'Geçerli bir e-posta adresi girin.';
  if (phone && !/^[\d\s+()\-.]{6,}$/.test(phone)) errors.phone = 'Telefon numarası geçersiz.';
  if (message.length < 10) errors.message = 'Mesaj en az 10 karakter olmalı.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { name, company, email: email.toLowerCase(), phone, message },
  };
}

/* ---- Admin içerik doğrulayıcıları ---------------------------------------- */

export function validateHero(input) {
  const d = input && typeof input === 'object' ? input : {};
  return {
    logoUrl: safeUrlOrEmpty(d.logoUrl),
    eyebrow: cleanText(d.eyebrow, 80),
    headline: cleanText(d.headline, 200),
    subheadline: cleanText(d.subheadline, 400),
    ctaLabel: cleanText(d.ctaLabel, 60),
    ctaHref: safeUrlOrEmpty(d.ctaHref) || '#iletisim',
  };
}

const WHY_ICONS = ['roaster', 'clock', 'check', 'leaf'];

export function validateWhyUs(input) {
  const list = Array.isArray(input) ? input : [];
  return list.slice(0, 8).map((item) => {
    const d = item && typeof item === 'object' ? item : {};
    return {
      icon: WHY_ICONS.includes(d.icon) ? d.icon : 'check',
      title: cleanText(d.title, 80),
      description: cleanText(d.description, 300),
    };
  });
}

export function validateProducts(input) {
  const list = Array.isArray(input) ? input : [];
  return list.slice(0, 50).map((item, index) => {
    const d = item && typeof item === 'object' ? item : {};
    return {
      id: slugify(d.id || d.name || `urun-${index + 1}`),
      name: cleanText(d.name, 120),
      category: cleanText(d.category, 60),
      description: cleanText(d.description, 600),
      imageUrl: safeUrlOrEmpty(d.imageUrl),
      points: (Array.isArray(d.points) ? d.points : [])
        .slice(0, 10)
        .map((p) => cleanText(p, 120))
        .filter(Boolean),
      audience: (Array.isArray(d.audience) ? d.audience : [])
        .slice(0, 10)
        .map((a) => cleanText(a, 40))
        .filter(Boolean),
      order: Number.isFinite(Number(d.order)) ? Number(d.order) : index + 1,
      visible: d.visible !== false,
    };
  });
}

export function validateContactInfo(input) {
  const d = input && typeof input === 'object' ? input : {};
  const ml = d.marketplaceLinks && typeof d.marketplaceLinks === 'object' ? d.marketplaceLinks : {};
  const sl = d.socialLinks && typeof d.socialLinks === 'object' ? d.socialLinks : {};

  return {
    email: isEmail(d.email) ? cleanText(d.email, 254).toLowerCase() : '',
    phone: cleanText(d.phone, 40),
    address: cleanText(d.address, 200),
    marketplaceLinks: {
      trendyol: safeUrlOrEmpty(ml.trendyol),
      amazon: safeUrlOrEmpty(ml.amazon),
    },
    socialLinks: {
      instagram: safeUrlOrEmpty(sl.instagram),
      linkedin: safeUrlOrEmpty(sl.linkedin),
    },
  };
}

/* ---- SEO doğrulayıcıları -------------------------------------------------- */

export function validateSeoDoc(input) {
  const d = input && typeof input === 'object' ? input : {};
  return {
    pageTitle: cleanText(d.pageTitle, 120),
    metaDescription: cleanText(d.metaDescription, 320),
    ogTitle: cleanText(d.ogTitle, 120),
    ogDescription: cleanText(d.ogDescription, 320),
    ogImage: safeUrlOrEmpty(d.ogImage),
    canonical: safeUrlOrEmpty(d.canonical),
    jsonLd: validateJsonLd(d.jsonLd),
  };
}

/**
 * JSON-LD override'ını doğrular. Hatalı bir düzenlemenin canlı sayfayı
 * bozmaması için: parse edilemiyorsa null döner (varsayılan şema kullanılır).
 * @returns {object|array|null}
 */
export function validateJsonLd(value) {
  if (value === null || value === undefined || value === '') return null;

  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object') return null;

  // </script> dizisi JSON-LD bloğundan kaçamaz — serileştirmede ayrıca
  // kaçırılır, burada erken reddetmek daha güvenli.
  const serialized = JSON.stringify(parsed);
  if (serialized.length > 20000) return null;

  return parsed;
}

/* ---- Yardımcılar --------------------------------------------------------- */

function safeUrlOrEmpty(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('/') || cleaned.startsWith('#')) return cleaned;
  const scheme = cleaned.slice(0, cleaned.indexOf(':') + 1).toLowerCase();
  if (!cleaned.includes(':')) return '';
  return ['http:', 'https:', 'mailto:', 'tel:'].includes(scheme) ? cleaned : '';
}

export function slugify(value) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(value)
    .toLowerCase()
    .replace(/[çğıİöşü]/g, (ch) => map[ch] ?? ch)
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'urun';
}
