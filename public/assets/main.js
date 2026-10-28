/**
 * main.js — public site, progressive enhancement.
 *
 * Sayfa JS olmadan da tam çalışır: menü bağlantıları normal <a>, form normal
 * bir POST, hero nötr değerlerle çizilir, vitrin elle kaydırılır. Buradaki kod
 * yalnızca deneyimi iyileştirir (mobil menü, vitrin geçişi, sayfa yenilemeden
 * form gönderimi, hero parallax).
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

    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---- Vitrin ------------------------------------------------------------ */
  /*
   * Slayt geçişi. Süreyi CSS tutar: aktif süre çubuğunun dolma animasyonu
   * bitince (animationend) sonraki slayta geçilir. Böylece durdurma, arka
   * plan sekmesi ve klavye odağında bekleme tek yerde, CSS'teki
   * animation-play-state ile çözülür; ayrı bir zamanlayıcı yoktur.
   *
   * Otomatik geçiş WCAG 2.2.2 gereği durdurulabilir; "hareketi azalt"
   * tercihinde durdurulmuş başlar. JS yoksa düğmeler `hidden` kalır ve
   * yalnızca ilk slayt görünür.
   */

  var showcase = document.querySelector('.showcase');
  var controls = showcase && showcase.querySelector('.showcase__controls');

  if (controls) {
    var track = showcase.querySelector('.showcase__track');
    var slides = showcase.querySelectorAll('.showcase__slide');
    var steps = showcase.querySelectorAll('.showcase__step');
    var stepBar = showcase.querySelector('.showcase__steps');
    var pauseBtn = controls.querySelector('[data-showcase="pause"]');
    var index = 0;
    var paused = reduceMotion;

    var show = function (next) {
      var count = slides.length;
      next = (next + count) % count;
      if (next === index) return;

      slides[index].classList.remove('is-active');
      slides[next].classList.add('is-active');
      index = next;

      steps.forEach(function (step, i) {
        step.classList.toggle('is-done', i < index);
        step.classList.toggle('is-current', i === index);
        if (i === index) step.setAttribute('aria-current', 'true');
        else step.removeAttribute('aria-current');
      });
    };

    var setPaused = function (value) {
      paused = value;
      showcase.setAttribute('data-paused', value ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', value ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur');
      // Kendiliğinden değişirken okunmaz; durdurulunca elle geçiş duyurulur.
      track.setAttribute('aria-live', value ? 'polite' : 'off');
    };

    showcase.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('showcase__fill')) show(index + 1);
    });

    showcase.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-showcase]');
      if (!btn) return;

      var action = btn.getAttribute('data-showcase');
      if (action === 'pause') setPaused(!paused);
      else if (action === 'next') show(index + 1);
      else if (action === 'prev') show(index - 1);
      else show(Number(action));
    });

    showcase.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
    });

    // Dokunmatik: yatay kaydırma slayt değiştirir, dikey kaydırma sayfayı
    // kaydırmaya devam eder (CSS touch-action: pan-y).
    var touchX = null;
    showcase.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    showcase.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Arka plandaki sekmede süre işlemesin
    document.addEventListener('visibilitychange', function () {
      showcase.classList.toggle('is-idle', document.hidden);
    });

    steps[0].setAttribute('aria-current', 'true');
    setPaused(paused);
    stepBar.hidden = false;
    controls.hidden = false;
  }

  /* ---- Hero parallax ----------------------------------------------------- */
  /*
   * Tasarımdaki scroll'a bağlı kayma / eğim / solma efekti.
   * Değerler CSS custom property olarak yazılır; stil dosyası bunları
   * kullanır, JS yoksa :root'taki nötr varsayılanlar geçerli kalır.
   *
   * Hero sayfanın ortasında durduğu için mesafe sayfa başından değil,
   * hero'nun üst kenarından ölçülür: efekt hero ekranın üstüne
   * ulaştığında başlar.
   */

  var hero = document.querySelector('.hero__title');
  var heroSection = hero && hero.closest('.hero');

  if (heroSection && !reduceMotion) {
    var ticking = false;

    var applyHero = function () {
      var y = Math.max(0, -heroSection.getBoundingClientRect().top);
      var style = document.documentElement.style;

      style.setProperty('--hero-shift', Math.min(y / 12, 30).toFixed(2) + 'px');
      style.setProperty('--hero-skew', Math.min(y / 90, 4).toFixed(2) + 'deg');
      style.setProperty('--hero-opacity', Math.max(1 - y / 500, 0.35).toFixed(3));

      ticking = false;
    };

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(applyHero);
      },
      { passive: true }
    );

    applyHero();
  }

  /* ---- Yumuşak kaydırma -------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href').slice(1);
    if (!id) return;

    // Logo bağlantısı: sayfanın en üstü (vitrin), bir öğe değil
    if (id === 'top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }

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

    /**
     * Turnstile token'ı tek kullanımlıktır: başarısız bir gönderimden sonra
     * sıfırlanmazsa kullanıcının ikinci denemesi de reddedilir.
     */
    var resetTurnstile = function () {
      try {
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
          window.turnstile.reset();
        }
      } catch (e) {
        /* widget yüklenmemişse önemsiz */
      }
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

      // Turnstile token'ı forma gizli bir input olarak kendisi ekler; FormData
      // onu "cf-turnstile-response" adıyla toplar ve sunucu orada arar.
      var payload = Object.fromEntries(new FormData(form));

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          // WAF'tan gelen 429 HTML döner, JSON değil — parse hatası tüm akışı
          // catch'e düşürmesin diye boş nesneye çevriliyor.
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: res.ok, status: res.status, data: data };
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
          var message = first ? errors[first] : result.data.error;

          // 429 doğrudan Cloudflare WAF'tan gelir; gövdesi bizim JSON
          // formatımızda değildir, o yüzden özel olarak ele alınır.
          if (result.status === 429) {
            message = 'Çok hızlı denediniz. Lütfen birkaç saniye bekleyip tekrar gönderin.';
          }

          setStatus(message || 'Mesaj gönderilemedi.', 'error');
          resetTurnstile();

          if (submit) {
            submit.disabled = false;
            submit.textContent = originalLabel;
          }
        })
        .catch(function () {
          setStatus('Bağlantı kurulamadı. Lütfen tekrar deneyin.', 'error');
          resetTurnstile();
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
    var targets = document.querySelectorAll('.why-card, .svc-card, .shop-card');

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
