import { escapeHtml, safeUrl, telHref } from '../lib/validate.js';
import { icon } from '../lib/icons.js';

/**
 * İletişim — sol sütunda bilgiler, sağ sütunda form.
 *
 * Form gerçek bir <form method="post" action="/api/contact"> olarak render
 * edilir: JS kapalıysa da gönderilebilir. main.js bunu fetch()'e yükseltip
 * sayfa yenilemeden inline geri bildirim verir.
 */
export function renderContact({ contact }) {
  const email = contact?.email || '';
  const phone = contact?.phone || '';
  const address = contact?.address || '';

  const mailHref = email ? safeUrl(`mailto:${email}`) : '';
  const phoneHref = telHref(phone);

  const lines = [
    mailHref
      ? `<a class="contact__item" href="${mailHref}">
           <span class="contact__icon" style="color: var(--accent-bronze)">${icon('mail', { size: 18 })}</span>
           ${escapeHtml(email)}
         </a>`
      : '',
    phoneHref
      ? `<a class="contact__item" href="${phoneHref}">
           <span class="contact__icon" style="color: var(--accent-bronze)">${icon('phone', { size: 18 })}</span>
           ${escapeHtml(phone)}
         </a>`
      : '',
    address
      ? `<p class="contact__item contact__item--muted">
           <span class="contact__icon" style="color: var(--accent-bronze)">${icon('pin', { size: 18 })}</span>
           ${escapeHtml(address)}
         </p>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `
  <section class="section section--alt" id="iletisim" aria-labelledby="iletisim-baslik">
    <div class="contact-grid">
      <div class="contact__intro">
        <div>
          <p class="eyebrow">İLETİŞİM</p>
          <h2 class="contact__title" id="iletisim-baslik">Kurumsal teklif alın</h2>
          <p class="contact__desc">
            Toptan tedarik, özel kavurma ve markalı ambalaj çözümleri için ekibimizle iletişime geçin.
          </p>
        </div>
        ${lines ? `<div class="contact__list">${lines}</div>` : ''}
      </div>

      <form class="form" id="contact-form" method="post" action="/api/contact" novalidate>
        <div class="form__row">
          <label class="sr-only" for="cf-name">Ad Soyad</label>
          <input class="form__field" id="cf-name" name="name" required
                 autocomplete="name" maxlength="120" placeholder="Ad Soyad">

          <label class="sr-only" for="cf-company">Firma Adı</label>
          <input class="form__field" id="cf-company" name="company" required
                 autocomplete="organization" maxlength="160" placeholder="Firma Adı">
        </div>

        <div class="form__row">
          <label class="sr-only" for="cf-email">E-posta</label>
          <input class="form__field" id="cf-email" name="email" type="email" required
                 autocomplete="email" maxlength="254" placeholder="E-posta">

          <label class="sr-only" for="cf-phone">Telefon</label>
          <input class="form__field" id="cf-phone" name="phone" type="tel"
                 autocomplete="tel" maxlength="40" placeholder="Telefon">
        </div>

        <label class="sr-only" for="cf-message">Mesajınız</label>
        <textarea class="form__field" id="cf-message" name="message" rows="4" required
                  maxlength="4000" placeholder="Mesajınız"></textarea>

        <p class="form__status" id="form-status" role="status" aria-live="polite"></p>

        <button class="btn btn--primary form__submit" type="submit">MESAJI GÖNDER</button>
      </form>
    </div>
  </section>`;
}
