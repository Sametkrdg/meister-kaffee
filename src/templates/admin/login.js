import { escapeHtml } from '../../lib/validate.js';

/**
 * Admin giriş ekranı. Sitenin tasarım token'larını kullanır ama public
 * main.css'i yüklemez — panelin kendi (çok daha küçük) admin.css'i vardır.
 */
export function renderLoginPage({ nextPath = '', configError = false } = {}) {
  const next = escapeHtml(nextPath || '');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yönetim Girişi — Meister Kaffee-Rösterei</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="/images/favicon.png" type="image/png">
  <meta name="theme-color" content="#FAF9F6">
  <meta name="color-scheme" content="light">
  <link rel="stylesheet" href="/assets/admin.css">
</head>
<body class="auth">
  <main class="auth__card">
    <div class="auth__brand">
      <img src="/images/logomark.png" alt="" width="242" height="354" class="auth__mark">
      <p class="auth__name">MEISTER</p>
      <p class="auth__sub">KAFFEE-RÖSTEREİ</p>
    </div>

    <h1 class="auth__title">Yönetim Paneli</h1>

    ${
      configError
        ? `<p class="alert alert--error">Sunucu yapılandırması eksik: <code>SESSION_SECRET</code>
             tanımlı değil. Giriş yapılamaz.</p>`
        : ''
    }

    <form class="auth__form" id="login-form" method="post" action="/api/admin/login" novalidate>
      <input type="hidden" name="next" value="${next}">

      <label class="field">
        <span class="field__label">E-POSTA</span>
        <input class="field__input" type="email" name="email" required
               autocomplete="username" autofocus maxlength="254">
      </label>

      <label class="field">
        <span class="field__label">ŞİFRE</span>
        <input class="field__input" type="password" name="password" required
               autocomplete="current-password" maxlength="200">
      </label>

      <p class="alert" id="login-status" role="status" aria-live="polite"></p>

      <button class="btn-admin" type="submit">GİRİŞ YAP</button>
    </form>
  </main>

  <script src="/assets/admin.js" defer></script>
</body>
</html>
`;
}
