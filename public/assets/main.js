/**
 * main.js — public site, progressive enhancement.
 *
 * Sayfa JS olmadan da tam çalışır: menü bağlantıları normal <a>, form normal
 * bir POST. Buradaki kod yalnızca deneyimi iyileştirir (mobil menü, sayfa
 * yenilemeden form gönderimi, scroll-reveal).
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobil menü -------------------------------------------------------- */

  var toggle = document.querySelector('.nav__toggle');
  var links = document.getElementById('nav-links');

  if (toggle && links) {
    var setOpen = function (open) {
      links.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    };

    setOpen(false);

    toggle.addEventListener('click', function () {
      setOpen(links.getAttribute('data-open') !== 'true');
    });

    // Bir bağlantıya tıklanınca menü kapansın
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---- Yumuşak kaydırma -------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href').slice(1);
    if (!id) return;

    var target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  });

  /* ---- İletişim formu ---------------------------------------------------- */

  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    var submit = form.querySelector('.form__submit');
    var originalLabel = submit ? submit.textContent : '';

    var setStatus = function (message, kind) {
      status.textContent = message;
      status.className = 'form__status' + (kind ? ' form__status--' + kind : '');
    };

    var clearFieldErrors = function () {
      form.querySelectorAll('.form__field--invalid').forEach(function (el) {
        el.classList.remove('form__field--invalid');
        el.removeAttribute('aria-invalid');
      });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFieldErrors();

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'GÖNDERİLİYOR…';
      }
      setStatus('', null);

      var payload = Object.fromEntries(new FormData(form));

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            form.reset();
            setStatus(result.data.message, 'ok');
            if (submit) {
              submit.textContent = 'GÖNDERİLDİ ✓';
              submit.classList.add('form__submit--sent');
            }
            return;
          }

          var errors = result.data.errors || {};
          Object.keys(errors).forEach(function (field) {
            var el = form.querySelector('[name="' + field + '"]');
            if (el) {
              el.classList.add('form__field--invalid');
              el.setAttribute('aria-invalid', 'true');
            }
          });

          var first = Object.keys(errors)[0];
          setStatus(first ? errors[first] : result.data.error || 'Mesaj gönderilemedi.', 'error');

          if (submit) {
            submit.disabled = false;
            submit.textContent = originalLabel;
          }
        })
        .catch(function () {
          setStatus('Bağlantı kurulamadı. Lütfen tekrar deneyin.', 'error');
          if (submit) {
            submit.disabled = false;
            submit.textContent = originalLabel;
          }
        });
    });

    // JS'siz gönderim sonrası ana sayfaya dönülmüşse sonucu göster
    var params = new URLSearchParams(location.search);
    if (params.has('gonderildi')) {
      setStatus('Mesajınız alındı. En kısa sürede dönüş yapacağız.', 'ok');
    } else if (params.has('hata')) {
      setStatus('Mesaj gönderilemedi. Lütfen formu kontrol edip tekrar deneyin.', 'error');
    }
  }

  /* ---- Scroll-reveal ----------------------------------------------------- */

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.why-card, .svc-card, .market__link');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }
})();
