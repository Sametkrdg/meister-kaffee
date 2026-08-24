/**
 * GET /api/admin/seo — bölüm ve ürün SEO dokümanları
 * PUT /api/admin/seo — doğrulanmış SEO dokümanlarını KV'ye yazar
 *
 * Guard (functions/api/admin/_middleware.js) oturumu ve CSRF'i çoktan
 * doğrulamıştır; burada yalnızca doğrulama ve yazma yapılır.
 *
 * NEDEN AYRI BİR ENDPOINT: SEO dokümanları paneldeki her açılışta değil,
 * yalnızca SEO sekmesi ilk kez açıldığında çekilir. `/api/admin/content`
 * içine katılsalardı her panel açılışı 4 bölüm + N ürün dokümanı daha
 * okurdu (Workers ücretsiz planında istek başına 50 alt-istek sınırı var).
 *
 * PUT gövdesi KISMİDİR: panel yalnızca DEĞİŞEN dokümanları gönderir.
 * Sebep: KV ücretsiz planında günlük 1.000 yazma hakkı var; her kaydetmede
 * 4 bölüm + N ürün yazmak bu bütçeyi hızla tüketirdi.
 */

import {
  KEYS,
  SEO_SECTIONS,
  SEO_DEFAULTS,
  SEO_PRODUCT_DEFAULT,
  SEO_PRODUCT_READ_LIMIT,
  readDoc,
  writeDoc,
  touchMeta,
} from '../../../src/lib/kv-schema.js';
import { validateSeoDoc, parseJsonLdInput } from '../../../src/lib/validate.js';
import { jsonResponse } from '../../../src/lib/admin-guard.js';

/** Panelin ürün sekmelerini çizebilmesi için ürün kimlik/adları. */
async function readProductIndex(kv) {
  const products = await readDoc(kv, KEYS.products);
  return (Array.isArray(products) ? products : [])
    .filter((p) => p && p.id)
    .slice(0, SEO_PRODUCT_READ_LIMIT)
    .map((p) => ({ id: p.id, name: p.name || p.id, visible: p.visible !== false }));
}

export async function onRequestGet(context) {
  const { env } = context;

  const index = await readProductIndex(env.CONTENT_KV);

  const [sectionDocs, productDocs] = await Promise.all([
    Promise.all(
      SEO_SECTIONS.map((s) =>
        readDoc(env.CONTENT_KV, KEYS.seo(s), SEO_DEFAULTS[s] || SEO_PRODUCT_DEFAULT)
      )
    ),
    Promise.all(
      index.map((p) => readDoc(env.CONTENT_KV, KEYS.seoProduct(p.id), SEO_PRODUCT_DEFAULT))
    ),
  ]);

  const sections = {};
  SEO_SECTIONS.forEach((name, i) => {
    sections[name] = sectionDocs[i];
  });

  const products = {};
  index.forEach((p, i) => {
    products[p.id] = productDocs[i];
  });

  return jsonResponse({ ok: true, data: { sections, products, productIndex: index } });
}

/**
 * Tek bir dokümanı doğrular.
 * @returns {{ ok: true, doc: object } | { ok: false, error: string }}
 */
function prepareDoc(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};

  // JSON-LD ÖNCE ayrı doğrulanır: validateSeoDoc bozuk girdiyi sessizce
  // null'a çevirir, panel ise açık bir hata mesajı görmelidir.
  const jsonLd = parseJsonLdInput(input.jsonLd);
  if (!jsonLd.ok) return { ok: false, error: jsonLd.error };

  return { ok: true, doc: validateSeoDoc({ ...input, jsonLd: jsonLd.value }) };
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

  const sectionsIn = payload.sections && typeof payload.sections === 'object' ? payload.sections : {};
  const productsIn = payload.products && typeof payload.products === 'object' ? payload.products : {};

  // Bilinmeyen bölüm adı KV'ye rastgele anahtar yazılmasını sağlardı.
  for (const name of Object.keys(sectionsIn)) {
    if (!SEO_SECTIONS.includes(name)) {
      return jsonResponse({ ok: false, error: `Bilinmeyen bölüm: ${name}` }, 400);
    }
  }

  // Ürün kimlikleri gerçekten var olan ürünlere ait olmalı.
  const known = new Set((await readProductIndex(env.CONTENT_KV)).map((p) => p.id));
  for (const id of Object.keys(productsIn)) {
    if (!known.has(id)) {
      return jsonResponse({ ok: false, error: `Bilinmeyen ürün: ${id}` }, 400);
    }
  }

  const writes = [];
  const savedSections = {};
  const savedProducts = {};
  const errors = {};

  for (const [name, raw] of Object.entries(sectionsIn)) {
    const result = prepareDoc(raw);
    if (!result.ok) {
      errors[`section:${name}`] = result.error;
      continue;
    }
    savedSections[name] = result.doc;
    writes.push(writeDoc(env.CONTENT_KV, KEYS.seo(name), result.doc));
  }

  for (const [id, raw] of Object.entries(productsIn)) {
    const result = prepareDoc(raw);
    if (!result.ok) {
      errors[`product:${id}`] = result.error;
      continue;
    }
    savedProducts[id] = result.doc;
    writes.push(writeDoc(env.CONTENT_KV, KEYS.seoProduct(id), result.doc));
  }

  // Tek bir bozuk JSON-LD varsa HİÇBİR ŞEY yazılmaz: yarısı kaydedilmiş bir
  // durumda panelin "kaydedildi" demesi yöneticiyi yanıltırdı.
  if (Object.keys(errors).length > 0) {
    return jsonResponse(
      { ok: false, error: 'JSON-LD doğrulamasından geçmedi; hiçbir değişiklik kaydedilmedi.', errors },
      400
    );
  }

  if (writes.length === 0) {
    return jsonResponse({ ok: false, error: 'Güncellenecek bir doküman gönderilmedi.' }, 400);
  }

  try {
    await Promise.all(writes);
  } catch (error) {
    console.error('[admin/seo] KV yazma hatası:', error && error.message);
    return jsonResponse({ ok: false, error: 'Kaydedilemedi. Lütfen tekrar deneyin.' }, 503);
  }

  const meta = await touchMeta(env.CONTENT_KV, data?.session?.sub || null);

  // Doğrulanmış hali geri döndürülür ki panel yeniden GET atmak zorunda
  // kalmasın (WAF: /api/* için IP başına 5 istek / 10 saniye).
  return jsonResponse({
    ok: true,
    data: { sections: savedSections, products: savedProducts },
    meta,
  });
}

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();
  if (method === 'GET') return onRequestGet(context);
  if (method === 'PUT') return onRequestPut(context);
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, PUT' } });
}
