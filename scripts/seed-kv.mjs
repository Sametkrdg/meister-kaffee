#!/usr/bin/env node
/**
 * seed-kv.mjs — tek seferlik yerel kurulum scripti.
 *
 * 1. Admin şifresini PBKDF2-SHA256 ile hashler ve ADMIN_KV'ye yazar.
 * 2. Başlangıç içerik + SEO dokümanlarını CONTENT_KV'ye yazar.
 *
 * Gereken ortam değişkenleri: ADMIN_EMAIL, ADMIN_PASSWORD, PASSWORD_PEPPER.
 * PASSWORD_PEPPER, Cloudflare Pages'teki değerle birebir aynı olmalıdır.
 *
 * PowerShell'de (bash tarzı "VAR=deger komut" sözdizimi PowerShell'de çalışmaz):
 *   $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; $env:PASSWORD_PEPPER="..."
 *   npm run seed
 *
 * --local  : wrangler'ın yerel (miniflare) KV deposuna yazar, `wrangler pages dev` için
 * (varsayılan) : uzak Cloudflare KV namespace'ine yazar
 * --sadece-sifre : YALNIZCA admin:credentials yazılır (şifre sıfırlama).
 *   Bu bayrak olmadan içerik + SEO dokümanları da varsayılana döner ve
 *   panelden yapılmış tüm düzenlemeler silinir.
 *
 * Şifre asla diske veya KV'ye düz metin olarak yazılmaz; yalnızca hash + salt.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPassword } from '../src/lib/auth.js';
import { KEYS, DEFAULTS, SEO_DEFAULTS, SEO_SECTIONS } from '../src/lib/kv-schema.js';

const isLocal = process.argv.includes('--local');
const credentialsOnly = process.argv.includes('--sadece-sifre');
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const pepper = process.env.PASSWORD_PEPPER || '';

function fail(message) {
  console.error(`\n  HATA: ${message}\n`);
  process.exit(1);
}

if (!email) fail('ADMIN_EMAIL ortam değişkeni tanımlı değil.');
if (!password) fail('ADMIN_PASSWORD ortam değişkeni tanımlı değil.');
if (password.length < 12) fail('ADMIN_PASSWORD en az 12 karakter olmalı.');
if (!pepper) {
  fail(
    [
      'PASSWORD_PEPPER ortam değişkeni tanımlı değil.',
      '  Bu değer .dev.vars ile Cloudflare Pages ortam değişkenindekiyle AYNI olmalı;',
      '  farklıysa üretilen hash ile giriş doğrulaması asla eşleşmez.',
    ].join('\n')
  );
}

const tmpDir = mkdtempSync(join(tmpdir(), 'mk-seed-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

let fileCounter = 0;

/**
 * wrangler kv key put — binding üzerinden yazar (wrangler.toml'daki id'ler kullanılır).
 *
 * Değer komut satırı argümanı olarak DEĞİL, --path ile geçici bir dosyadan
 * verilir. Sebep: shell:true altında Windows cmd.exe argümandaki çift tırnakları
 * yutuyor ve KV'ye {email:...} gibi GEÇERSİZ JSON yazılıyordu. Bu sessiz bir
 * arızaydı: Worker parse edemeyip varsayılana düştüğü için site doğru görünüyor,
 * ama KV içeriği hiç okunmuyordu.
 */
function kvPut(binding, key, value) {
  const valueFile = join(tmpDir, `v${fileCounter++}.json`);
  writeFileSync(valueFile, JSON.stringify(value), 'utf8');

  const args = [
    'wrangler', 'kv', 'key', 'put',
    JSON.stringify(key),
    `--path=${JSON.stringify(valueFile)}`,
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
const hashed = await hashPassword(password, pepper);
kvPut('ADMIN_KV', KEYS.credentials, { email, ...hashed });

if (credentialsOnly) {
  console.log('\n  --sadece-sifre: içerik ve SEO dokümanlarına dokunulmadı.');
} else {
  // 2) İçerik dokümanları
  kvPut('CONTENT_KV', KEYS.hero, DEFAULTS[KEYS.hero]);
  kvPut('CONTENT_KV', KEYS.whyUs, DEFAULTS[KEYS.whyUs]);
  kvPut('CONTENT_KV', KEYS.products, DEFAULTS[KEYS.products]);
  kvPut('CONTENT_KV', KEYS.contact, DEFAULTS[KEYS.contact]);
  // İletişim formu kayıtları için başlangıç anahtarı YOKTUR: her kayıt kendi
  // `content:submission:<tarih>-<id>` anahtarına yazılır (bkz. kv-schema.js).
  kvPut('CONTENT_KV', KEYS.meta, {
    updatedAt: new Date().toISOString(),
    updatedBy: 'seed-kv.mjs',
  });

  // 3) SEO dokümanları
  for (const section of SEO_SECTIONS) {
    kvPut('CONTENT_KV', KEYS.seo(section), SEO_DEFAULTS[section]);
  }
}

// 4) Geri okuma doğrulaması
//
// Bir kez KV'ye tırnaksız (geçersiz JSON) yazılıp bu SESSİZCE fark edilmemişti:
// Worker parse edemeyince kv-schema varsayılanına düşüyor, site doğru görünüyor
// ama KV içeriği hiç okunmuyor. Bu yüzden seed sonunda her namespace'ten bir
// anahtar geri okunup gerçekten parse edilebiliyor mu diye bakılır.
function assertParsable(binding, key) {
  const args = [
    'wrangler', 'kv', 'key', 'get',
    JSON.stringify(key),
    `--binding=${binding}`,
    isLocal ? '--local' : '--remote',
    '--preview', 'false',
  ];

  let raw;
  try {
    raw = execFileSync('npx', args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: true });
  } catch (error) {
    fail(`${binding}/${key} geri okunamadı.\n  ${(error.stderr || '').toString().trim()}`);
  }

  try {
    JSON.parse(raw.trim());
    console.log(`  ✓ doğrulandı  ${binding}  ${key}`);
  } catch {
    fail(
      `${binding}/${key} KV'ye GEÇERSİZ JSON olarak yazılmış.\n` +
      `  İlk 80 karakter: ${raw.trim().slice(0, 80)}\n` +
      `  Bu genelde değerin komut satırı argümanı olarak geçirilmesinden olur.`
    );
  }
}

console.log('\n  Doğrulanıyor…');
assertParsable('ADMIN_KV', KEYS.credentials);
if (!credentialsOnly) assertParsable('CONTENT_KV', KEYS.hero);

console.log(`\n  Tamamlandı. Admin girişi: ${email}`);
console.log('  Şifreyi ilk girişten sonra panelden değiştirmeyi unutma.\n');
