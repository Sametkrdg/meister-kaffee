#!/usr/bin/env node
/**
 * seed-kv.mjs — tek seferlik yerel kurulum scripti.
 *
 * 1. Admin şifresini PBKDF2-SHA256 ile hashler ve ADMIN_KV'ye yazar.
 * 2. Başlangıç içerik + SEO dokümanlarını CONTENT_KV'ye yazar.
 *
 * Kullanım:
 *   ADMIN_EMAIL="admin@meisterkaffee.com" ADMIN_PASSWORD="..." node scripts/seed-kv.mjs
 *   ADMIN_EMAIL="..." ADMIN_PASSWORD="..." node scripts/seed-kv.mjs --local
 *
 * --local  : wrangler'ın yerel (miniflare) KV deposuna yazar, `wrangler pages dev` için
 * (varsayılan) : uzak Cloudflare KV namespace'ine yazar
 *
 * Şifre asla diske veya KV'ye düz metin olarak yazılmaz; yalnızca hash + salt.
 */

import { execFileSync } from 'node:child_process';
import { hashPassword } from '../src/lib/auth.js';
import { KEYS, DEFAULTS, SEO_DEFAULTS, SEO_SECTIONS } from '../src/lib/kv-schema.js';

const isLocal = process.argv.includes('--local');
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

function fail(message) {
  console.error(`\n  HATA: ${message}\n`);
  process.exit(1);
}

if (!email) fail('ADMIN_EMAIL ortam değişkeni tanımlı değil.');
if (!password) fail('ADMIN_PASSWORD ortam değişkeni tanımlı değil.');
if (password.length < 12) fail('ADMIN_PASSWORD en az 12 karakter olmalı.');

/** wrangler kv key put — binding üzerinden yazar (wrangler.toml'daki id'ler kullanılır). */
function kvPut(binding, key, value) {
  const args = [
    'wrangler', 'kv', 'key', 'put',
    key,
    JSON.stringify(value),
    `--binding=${binding}`,
    isLocal ? '--local' : '--remote',
    '--preview', 'false',
  ];

  try {
    execFileSync('npx', args, { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8', shell: true });
    console.log(`  ✓ ${binding}  ${key}`);
  } catch (error) {
    const stderr = (error.stderr || '').toString().trim();
    fail(`${binding}/${key} yazılamadı.\n  ${stderr}`);
  }
}

console.log(`\n  Hedef: ${isLocal ? 'YEREL (miniflare)' : 'UZAK (Cloudflare KV)'}\n`);

// 1) Admin kimlik bilgileri
const hashed = await hashPassword(password);
kvPut('ADMIN_KV', KEYS.credentials, { email, ...hashed });

// 2) İçerik dokümanları
kvPut('CONTENT_KV', KEYS.hero, DEFAULTS[KEYS.hero]);
kvPut('CONTENT_KV', KEYS.whyUs, DEFAULTS[KEYS.whyUs]);
kvPut('CONTENT_KV', KEYS.products, DEFAULTS[KEYS.products]);
kvPut('CONTENT_KV', KEYS.contact, DEFAULTS[KEYS.contact]);
kvPut('CONTENT_KV', KEYS.submissions, []);
kvPut('CONTENT_KV', KEYS.meta, {
  updatedAt: new Date().toISOString(),
  updatedBy: 'seed-kv.mjs',
});

// 3) SEO dokümanları
for (const section of SEO_SECTIONS) {
  kvPut('CONTENT_KV', KEYS.seo(section), SEO_DEFAULTS[section]);
}

console.log(`\n  Tamamlandı. Admin girişi: ${email}`);
console.log('  Şifreyi ilk girişten sonra panelden değiştirmeyi unutma.\n');
