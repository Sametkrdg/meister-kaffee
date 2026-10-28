/**
 * GET  /api/admin/content — panelin doldurulacağı güncel dokümanlar
 * PUT  /api/admin/content — doğrulanmış içeriği KV'ye yazar
 *
 * Guard (functions/api/admin/_middleware.js) oturumu ve CSRF'i çoktan
 * doğrulamıştır; burada yalnızca içerik doğrulaması ve yazma yapılır.
 *
 * PUT gövdesi kısmi olabilir: yalnızca gönderilen bölümler güncellenir.
 */

import {
  KEYS,
  readDoc,
  writeDoc,
  mergeShop,
  withMarketplaceDefaults,
  touchMeta,
  listSubmissions,
  readSubmission,
  deleteSubmission,
} from '../../../src/lib/kv-schema.js';
import {
  validateContactInfo,
  validateHero,
  validateProducts,
  validateShop,
  validateWhyUs,
} from '../../../src/lib/validate.js';
import { jsonResponse } from '../../../src/lib/admin-guard.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // Tek bir mesajın tam gövdesi (panelde "tamamını gör")
  const wanted = url.searchParams.get('mesaj');
  if (wanted) {
    const entry = await readSubmission(env.CONTENT_KV, wanted);
    if (!entry) return jsonResponse({ ok: false, error: 'Mesaj bulunamadı.' }, 404);
    return jsonResponse({ ok: true, data: { submission: entry } });
  }

  const [hero, whyUs, products, contact, shop, meta, submissions] = await Promise.all([
    readDoc(env.CONTENT_KV, KEYS.hero),
    readDoc(env.CONTENT_KV, KEYS.whyUs),
    readDoc(env.CONTENT_KV, KEYS.products),
    readDoc(env.CONTENT_KV, KEYS.contact),
    readDoc(env.CONTENT_KV, KEYS.shop),
    readDoc(env.CONTENT_KV, KEYS.meta),
    // Özetler metadata'dan gelir; gövdeler okunmaz (alt-istek bütçesi korunur).
    listSubmissions(env.CONTENT_KV, 100),
  ]);

  return jsonResponse({
    ok: true,
    data: {
      hero,
      whyUs,
      products,
      contact: withMarketplaceDefaults(contact),
      // Fotoğraf listesiyle birleşik hâl: panel küçük resimleri buradan çizer.
      shop: mergeShop(shop),
      meta,
      submissions: submissions.items,
      submissionsTotal: submissions.total,
    },
  });
}

/** KVKK silme talebi veya panelden temizlik. */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const key = new URL(request.url).searchParams.get('mesaj');

  if (!key) return jsonResponse({ ok: false, error: 'Silinecek mesaj belirtilmedi.' }, 400);

  const done = await deleteSubmission(env.CONTENT_KV, key);
  if (!done) return jsonResponse({ ok: false, error: 'Geçersiz mesaj anahtarı.' }, 400);

  return jsonResponse({ ok: true });
}

export async function onRequestPut(context) {
  const { request, env, data } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Geçersiz JSON gövdesi.' }, 400);
  }

  if (!payload || typeof payload !== 'object') {
    return jsonResponse({ ok: false, error: 'Geçersiz istek gövdesi.' }, 400);
  }

  // Her alan validate.js'den geçer — stored-XSS önlemi zorunludur.
  const writes = [];
  const updated = [];
  const saved = {};

  if (payload.hero !== undefined) {
    saved.hero = validateHero(payload.hero);
    writes.push(writeDoc(env.CONTENT_KV, KEYS.hero, saved.hero));
    updated.push('hero');
  }
  if (payload.whyUs !== undefined) {
    saved.whyUs = validateWhyUs(payload.whyUs);
    writes.push(writeDoc(env.CONTENT_KV, KEYS.whyUs, saved.whyUs));
    updated.push('why-us');
  }
  if (payload.products !== undefined) {
    saved.products = validateProducts(payload.products);
    writes.push(writeDoc(env.CONTENT_KV, KEYS.products, saved.products));
    updated.push('products');
  }
  if (payload.contact !== undefined) {
    const contact = validateContactInfo(payload.contact);
    writes.push(writeDoc(env.CONTENT_KV, KEYS.contact, contact));
    // Panel, sitede görünen hâli görsün (boş link varsayılanla dolu döner)
    saved.contact = withMarketplaceDefaults(contact);
    updated.push('contact');
  }
  if (payload.shop !== undefined) {
    const shop = validateShop(payload.shop);
    writes.push(writeDoc(env.CONTENT_KV, KEYS.shop, shop));
    // GET ile aynı şekil (fotoğraf alanları dahil) dönmeli; aksi halde panel
    // kaydettikten sonra küçük resimleri kaybeder ve formu "değişmiş" sanır.
    saved.shop = mergeShop(shop);
    updated.push('shop');
  }

  if (writes.length === 0) {
    return jsonResponse({ ok: false, error: 'Güncellenecek bir bölüm gönderilmedi.' }, 400);
  }

  try {
    await Promise.all(writes);
  } catch (error) {
    console.error('[admin/content] KV yazma hatası:', error && error.message);
    return jsonResponse({ ok: false, error: 'Kaydedilemedi. Lütfen tekrar deneyin.' }, 503);
  }

  const meta = await touchMeta(env.CONTENT_KV, data?.session?.sub || null);

  // Doğrulanmış (temizlenmiş) hâli geri döndürülür ki panel kaydettikten
  // sonra ayrı bir GET atmak zorunda kalmasın. Cloudflare WAF kuralı
  // /api/* için IP başına 5 istek / 10 saniyeye izin veriyor; panelde bir
  // kaydetme işlemi 3 istek harcarsa peş peşe iki işlem sınırı aşıyordu.
  return jsonResponse({ ok: true, updated, meta, data: saved });
}

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();
  if (method === 'GET') return onRequestGet(context);
  if (method === 'PUT') return onRequestPut(context);
  if (method === 'DELETE') return onRequestDelete(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, PUT, DELETE' } });
}
