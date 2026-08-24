/**
 * admin.js — yönetim paneli (vanilla JS, build adımı yok).
 *
 * İki ekranı da bu dosya yönetir: giriş formu ve panel.
 *
 * Güvenlik notu: değerler DOM'a her zaman .value / .textContent ile yazılır,
 * innerHTML ile ASLA. Sunucu tarafı zaten doğruluyor ama panel de KV'den
 * gelen veriyi güvenilmez kabul eder.
 */
(function () {
  'use strict';

  /* ---- Yardımcılar ------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf('=');
      if (eq < 0) continue;
      if (parts[i].slice(0, eq).trim() === name) return parts[i].slice(eq + 1).trim();
    }
    return '';
  }

  function api(path, options) {
    options = options || {};
    var headers = { Accept: 'application/json' };
    if (options.body) headers['Content-Type'] = 'application/json';

    var method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      headers['X-CSRF-Token'] = readCookie('mk_csrf');
    }

    return fetch(path, {
      method: method,
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
    }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          return { status: res.status, ok: res.ok, data: data };
        });
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ---- Şifre göster/gizle ------------------------------------------------ */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Göz ikonu. `crossed` true ise üzeri çizili (şifre görünür durumdayken
   * "gizle" anlamına gelir).
   *
   * innerHTML kullanılmıyor (dosya başındaki güvenlik notu); SVG düğümleri
   * createElementNS ile kuruluyor.
   */
  function eyeIcon(crossed) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    var outline = document.createElementNS(SVG_NS, 'path');
    outline.setAttribute('d', 'M1.8 12S5.6 5.8 12 5.8 22.2 12 22.2 12 18.4 18.2 12 18.2 1.8 12 1.8 12Z');
    svg.appendChild(outline);

    var pupil = document.createElementNS(SVG_NS, 'circle');
    pupil.setAttribute('cx', '12');
    pupil.setAttribute('cy', '12');
    pupil.setAttribute('r', '3');
    svg.appendChild(pupil);

    if (crossed) {
      var slash = document.createElementNS(SVG_NS, 'path');
      slash.setAttribute('d', 'M4 4l16 16');
      svg.appendChild(slash);
    }
    return svg;
  }

  /**
   * `.field__pw` sarmalayıcısındaki her şifre alanına göster/gizle düğmesi
   * ekler. Hem giriş ekranında hem panelin HESAP sekmesinde kullanılır.
   * Aynı alana iki kez düğme eklenmesin diye işaretlenir.
   */
  function enhancePasswordFields(root) {
    (root || document).querySelectorAll('.field__pw').forEach(function (wrap) {
      if (wrap.dataset.pwToggle === 'ready') return;

      var input = wrap.querySelector('input');
      if (!input) return;
      wrap.dataset.pwToggle = 'ready';

      var btn = document.createElement('button');
      // type="button" ZORUNLU: form içinde varsayılan tip "submit"tir ve
      // düğme giriş formunu göndermeye kalkardı.
      btn.type = 'button';
      btn.className = 'pw-toggle';

      var paint = function () {
        var shown = input.type === 'text';
        btn.textContent = '';
        btn.appendChild(eyeIcon(shown));
        btn.setAttribute('aria-label', shown ? 'Şifreyi gizle' : 'Şifreyi göster');
        btn.setAttribute('aria-pressed', shown ? 'true' : 'false');
        btn.title = shown ? 'Şifreyi gizle' : 'Şifreyi göster';
      };

      btn.addEventListener('click', function () {
        // ODAK DÜĞMEDE KALIR. Önce odağı input'a geri veriyorduk; ölçüldü:
        // klavyeyle Space'e basınca odak input'a kaçtığı için ikinci kez
        // Enter/Space basmak imkânsız hâle geliyordu ve ekran okuyucu
        // aria-pressed değişimini duyuramıyordu (odak taşınınca düğmenin
        // yeni durumu okunmaz).
        var focused = document.activeElement === input;
        var pos = focused ? input.selectionStart : null;

        input.type = input.type === 'password' ? 'text' : 'password';
        paint();

        // Yalnızca odak zaten alandaysa imleci yerinde tut: type değişimi
        // imleci sonuna atıyor.
        if (focused) {
          input.focus();
          try {
            if (pos !== null) input.setSelectionRange(pos, pos);
          } catch (e) {
            /* bazı tarayıcılar type değişiminden hemen sonra reddedebilir */
          }
        }
      });

      paint();
      wrap.appendChild(btn);
    });
  }

  /**
   * Hata mesajını insan diline çevirir.
   *
   * 429 özel olarak ele alınır: Cloudflare WAF kuralı /api/* için IP başına
   * 5 istek/10 sn sınırı uyguluyor ve bu yanıt Worker'a hiç ulaşmadığı için
   * gövdesi bizim JSON formatımızda değildir — jenerik "kaydedilemedi"
   * mesajı burada yanıltıcı olurdu.
   */
  function describeError(res, fallback) {
    if (res.status === 429) {
      return 'Çok hızlı işlem yaptınız. Lütfen ~10 saniye bekleyip tekrar deneyin.';
    }
    if (res.status === 413) return 'Gönderilen içerik çok büyük.';
    return (res.data && res.data.error) || fallback;
  }

  /* ---- Giriş ekranı ------------------------------------------------------ */

  var loginForm = document.getElementById('login-form');

  if (loginForm) {
    var loginStatus = document.getElementById('login-status');
    var loginBtn = loginForm.querySelector('button[type="submit"]');

    enhancePasswordFields(loginForm);

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = Object.fromEntries(new FormData(loginForm));
      loginStatus.textContent = '';
      loginStatus.className = 'alert';
      loginBtn.disabled = true;
      loginBtn.textContent = 'KONTROL EDİLİYOR…';

      api('/api/admin/login', {
        method: 'POST',
        body: { email: data.email, password: data.password },
      })
        .then(function (res) {
          if (res.ok && res.data.ok) {
            // Yalnızca site içi /admin yollarına dön. "//evil.com" ve
            // "https://…" zaten elenir; "/adminX" gibi komşu yollar da
            // kabul edilmesin diye sınır karakteri aranır.
            var raw = data.next || '';
            var safe = raw === '/admin' || /^\/admin[/?#]/.test(raw);
            window.location.href = safe ? raw : '/admin';
            return;
          }
          loginStatus.textContent = res.data.error || 'Giriş yapılamadı.';
          loginStatus.className = 'alert alert--error';
          loginBtn.disabled = false;
          loginBtn.textContent = 'GİRİŞ YAP';
        })
        .catch(function () {
          loginStatus.textContent = 'Bağlantı kurulamadı. Lütfen tekrar deneyin.';
          loginStatus.className = 'alert alert--error';
          loginBtn.disabled = false;
          loginBtn.textContent = 'GİRİŞ YAP';
        });
    });

    return; // panel kodunu çalıştırma
  }

  /* ---- Panel ------------------------------------------------------------- */

  var app = document.getElementById('app');
  if (!app) return;

  var savebar = document.getElementById('savebar');
  var savebarText = document.getElementById('savebar-text');
  var saveBtn = document.getElementById('save');
  var discardBtn = document.getElementById('discard');

  var state = {
    server: null,
    draft: null,
    panel: 'hero',
    // SEO ayrı yüklenir (bkz. SEO paneli); loading bayrağı aynı anda iki
    // istek gitmesini engeller.
    seo: { server: null, draft: null, productIndex: [], sub: 's:home', loading: false, error: '' },
  };

  var ICONS = [
    { value: 'roaster', label: 'Kavurma makinesi' },
    { value: 'clock', label: 'Saat / tazelik' },
    { value: 'check', label: 'Onay / kalite' },
    { value: 'leaf', label: 'Yaprak / sürdürülebilirlik' },
  ];

  function contentDirty() {
    return !!state.server && JSON.stringify(state.server) !== JSON.stringify(state.draft);
  }

  function isDirty() {
    return contentDirty() || seoDirty();
  }

  function refreshSavebar(message, kind) {
    if (message) {
      savebar.hidden = false;
      savebarText.textContent = message;
      savebarText.className = 'savebar__text' + (kind ? ' savebar__text--' + kind : '');
      return;
    }
    savebar.hidden = !isDirty();
    savebarText.textContent = 'Kaydedilmemiş değişiklikler var';
    savebarText.className = 'savebar__text';
  }

  function touched() {
    refreshSavebar();
  }

  /* --- alan üreticileri --- */

  function field(labelText, value, onInput, opts) {
    opts = opts || {};
    var wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field__label', labelText));

    var input;
    if (opts.multiline) {
      input = el('textarea', 'field__textarea');
      if (opts.rows) input.rows = opts.rows;
    } else {
      input = el('input', 'field__input');
      input.type = opts.type || 'text';
    }
    input.value = value === undefined || value === null ? '' : String(value);
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.maxlength) input.maxLength = opts.maxlength;

    // Karakter sayacı. İki yönlü uyarı verir ama HİÇBİRİ ENGELLEMEZ — ikisi de
    // tavsiye, kural değil:
    //   ÜST sınır: arama sonuçlarında başlık ~60, açıklama ~160 karakterden
    //     sonra kırpılır.
    //   ALT sınır: LinkedIn Post Inspector og:description 100 karakterin
    //     altındaysa uyarı veriyor (24 Ağustos 2026'da canlı sitede görüldü).
    // `opts.counter` sayı ise yalnızca üst sınır; { max, min } ise ikisi de.
    var counter = null;
    if (opts.counter) {
      var cmax = typeof opts.counter === 'number' ? opts.counter : opts.counter.max;
      var cmin = typeof opts.counter === 'number' ? 0 : opts.counter.min || 0;

      counter = el('p', 'field__count');
      var paint = function () {
        var len = input.value.length;
        var text = len + ' / ' + cmax + ' karakter';
        var cls = 'field__count';

        if (len > cmax) {
          text += ' — sınırı aştı, arama sonucunda kırpılır';
          cls += ' field__count--over';
        } else if (cmin && len > 0 && len < cmin) {
          text += ' — çok kısa, LinkedIn/OG için en az ' + cmin + ' karakter önerilir';
          cls += ' field__count--short';
        }

        counter.textContent = text;
        counter.className = cls;
      };
      paint();
      input.addEventListener('input', paint);
    }

    input.addEventListener('input', function () {
      onInput(input.value);
      touched();
    });

    wrap.appendChild(input);
    if (counter) wrap.appendChild(counter);
    if (opts.hint) wrap.appendChild(el('p', 'field__hint', opts.hint));
    return wrap;
  }

  function selectField(labelText, value, options, onChange) {
    var wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field__label', labelText));

    var select = el('select', 'field__select');
    options.forEach(function (opt) {
      var o = el('option', null, opt.label);
      o.value = opt.value;
      if (opt.value === value) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener('change', function () {
      onChange(select.value);
      touched();
    });

    wrap.appendChild(select);
    return wrap;
  }

  function checkboxField(labelText, checked, onChange) {
    var wrap = el('label', 'field field--check');

    var input = el('input');
    input.type = 'checkbox';
    input.checked = !!checked;
    input.addEventListener('change', function () {
      onChange(input.checked);
      touched();
    });

    wrap.appendChild(input);
    wrap.appendChild(el('span', 'field__label', labelText));
    return wrap;
  }

  function row2(a, b) {
    var r = el('div', 'row2');
    r.appendChild(a);
    r.appendChild(b);
    return r;
  }

  /* --- paneller --- */

  function panelHero() {
    var p = el('section', 'panel');
    p.dataset.panel = 'hero';
    var hero = state.draft.hero;

    p.appendChild(
      el('p', 'panel__intro', 'Ana sayfanın en üst bölümü. Başlıktaki satırlar "|" ile ayrılır.')
    );

    var card = el('div', 'card');
    card.appendChild(
      field('ÜST ETİKET', hero.eyebrow, function (v) { hero.eyebrow = v; }, { maxlength: 80 })
    );
    card.appendChild(
      field('BAŞLIK', hero.headline, function (v) { hero.headline = v; }, {
        multiline: true,
        rows: 3,
        maxlength: 200,
        hint:
          'Satırları "|" ile ayır. Soluk tonda görünmesini istediğin satırı yıldız içine al. ' +
          'Örnek: ZANAATKÂR|*TİTİZLİĞİYLE*|KAVRULMUŞ',
      })
    );
    card.appendChild(
      field('ALT METİN', hero.subheadline, function (v) { hero.subheadline = v; }, {
        multiline: true,
        rows: 3,
        maxlength: 400,
      })
    );
    card.appendChild(
      row2(
        field('BUTON YAZISI', hero.ctaLabel, function (v) { hero.ctaLabel = v; }, { maxlength: 60 }),
        field('BUTON BAĞLANTISI', hero.ctaHref, function (v) { hero.ctaHref = v; }, {
          maxlength: 200,
          hint: 'Sayfa içi bağlantı için #iletisim',
        })
      )
    );
    p.appendChild(card);
    return p;
  }

  function panelWhy() {
    var p = el('section', 'panel');
    p.dataset.panel = 'why';

    p.appendChild(
      el('p', 'panel__intro', 'Kartlar aynı zamanda hero altındaki kayan şeridi besler.')
    );

    state.draft.whyUs.forEach(function (item, index) {
      var card = el('div', 'card');

      var head = el('div', 'card__head');
      head.appendChild(el('p', 'card__title', 'KART ' + (index + 1)));
      var actions = el('div', 'card__actions');

      if (index > 0) actions.appendChild(moveBtn('↑ YUKARI', state.draft.whyUs, index, -1, panelWhy));
      if (index < state.draft.whyUs.length - 1)
        actions.appendChild(moveBtn('↓ AŞAĞI', state.draft.whyUs, index, 1, panelWhy));

      var del = el('button', 'btn-admin btn-admin--danger btn-admin--small', 'SİL');
      del.type = 'button';
      del.addEventListener('click', function () {
        state.draft.whyUs.splice(index, 1);
        render();
        touched();
      });
      actions.appendChild(del);
      head.appendChild(actions);
      card.appendChild(head);

      card.appendChild(
        selectField('İKON', item.icon, ICONS, function (v) { item.icon = v; })
      );
      card.appendChild(
        field('BAŞLIK', item.title, function (v) { item.title = v; }, { maxlength: 80 })
      );
      card.appendChild(
        field('AÇIKLAMA', item.description, function (v) { item.description = v; }, {
          multiline: true,
          rows: 2,
          maxlength: 300,
        })
      );
      p.appendChild(card);
    });

    var add = el('button', 'btn-admin btn-admin--ghost', '+ KART EKLE');
    add.type = 'button';
    add.addEventListener('click', function () {
      state.draft.whyUs.push({ icon: 'check', title: '', description: '' });
      render();
      touched();
    });
    p.appendChild(add);

    return p;
  }

  function panelProducts() {
    var p = el('section', 'panel');
    p.dataset.panel = 'products';

    p.appendChild(
      el('p', 'panel__intro', 'Sıralama "SIRA" alanına göre yapılır. Görünmeyenler sitede hiç çıkmaz.')
    );

    state.draft.products.forEach(function (item, index) {
      var card = el('div', 'card');

      var head = el('div', 'card__head');
      head.appendChild(el('p', 'card__title', 'ÜRÜN ' + (index + 1) + '  ·  ' + (item.id || 'yeni')));

      var actions = el('div', 'card__actions');
      var del = el('button', 'btn-admin btn-admin--danger btn-admin--small', 'SİL');
      del.type = 'button';
      del.addEventListener('click', function () {
        state.draft.products.splice(index, 1);
        render();
        touched();
      });
      actions.appendChild(del);
      head.appendChild(actions);
      card.appendChild(head);

      card.appendChild(
        row2(
          field('ETİKET', item.category, function (v) { item.category = v; }, { maxlength: 60 }),
          field('BAŞLIK', item.name, function (v) { item.name = v; }, { maxlength: 120 })
        )
      );
      card.appendChild(
        field('AÇIKLAMA', item.description, function (v) { item.description = v; }, {
          multiline: true,
          rows: 3,
          maxlength: 600,
        })
      );
      card.appendChild(
        field('MADDELER', (item.points || []).join('\n'), function (v) {
          item.points = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        }, { multiline: true, rows: 3, hint: 'Her satır bir madde.' })
      );
      // GÖRSEL URL: kv-schema'da ve JSON-LD Product.image alanında zaten
      // kullanılıyordu ama panelde alanı yoktu — bu yüzden hep boş kalıyor,
      // ürünler arama sonuçlarında görselsiz çıkıyordu.
      card.appendChild(
        field('GÖRSEL URL', item.imageUrl, function (v) { item.imageUrl = v; }, {
          maxlength: 300,
          hint: 'Arama sonuçlarındaki ürün görseli (JSON-LD). Boş bırakılabilir.',
        })
      );
      card.appendChild(
        row2(
          field('SIRA', item.order, function (v) { item.order = Number(v) || 0; }, { type: 'number' }),
          checkboxField('SİTEDE GÖRÜNSÜN', item.visible !== false, function (v) { item.visible = v; })
        )
      );
      p.appendChild(card);
    });

    var add = el('button', 'btn-admin btn-admin--ghost', '+ HİZMET EKLE');
    add.type = 'button';
    add.addEventListener('click', function () {
      state.draft.products.push({
        id: '',
        name: '',
        category: '',
        description: '',
        points: [],
        audience: [],
        order: state.draft.products.length + 1,
        visible: true,
      });
      render();
      touched();
    });
    p.appendChild(add);

    return p;
  }

  function panelContact() {
    var p = el('section', 'panel');
    p.dataset.panel = 'contact';
    var c = state.draft.contact;
    c.marketplaceLinks = c.marketplaceLinks || {};
    c.socialLinks = c.socialLinks || {};

    p.appendChild(
      el('p', 'panel__intro', 'Pazaryeri bağlantısı boş bırakılırsa o buton sitede hiç görünmez.')
    );

    var card = el('div', 'card');
    card.appendChild(el('p', 'card__title', 'İLETİŞİM BİLGİLERİ'));
    card.appendChild(
      row2(
        field('E-POSTA', c.email, function (v) { c.email = v; }, { type: 'email', maxlength: 254 }),
        field('TELEFON', c.phone, function (v) { c.phone = v; }, { maxlength: 40 })
      )
    );
    card.appendChild(
      row2(
        field('ADRES', c.address, function (v) { c.address = v; }, { maxlength: 200 }),
        field('KOORDİNAT', c.coordinates, function (v) { c.coordinates = v; }, {
          maxlength: 60,
          hint: 'Hero sağ üstte görünür. Boş bırakılırsa gizlenir.',
        })
      )
    );
    p.appendChild(card);

    var market = el('div', 'card');
    market.appendChild(el('p', 'card__title', 'PAZARYERLERİ'));
    market.appendChild(
      row2(
        field('TRENDYOL', c.marketplaceLinks.trendyol, function (v) {
          c.marketplaceLinks.trendyol = v;
        }, { maxlength: 300, placeholder: 'https://…' }),
        field('AMAZON', c.marketplaceLinks.amazon, function (v) {
          c.marketplaceLinks.amazon = v;
        }, { maxlength: 300, placeholder: 'https://…' })
      )
    );
    p.appendChild(market);

    var social = el('div', 'card');
    social.appendChild(el('p', 'card__title', 'SOSYAL MEDYA'));
    social.appendChild(
      row2(
        field('INSTAGRAM', c.socialLinks.instagram, function (v) {
          c.socialLinks.instagram = v;
        }, { maxlength: 300, placeholder: 'https://…' }),
        field('LINKEDIN', c.socialLinks.linkedin, function (v) {
          c.socialLinks.linkedin = v;
        }, { maxlength: 300, placeholder: 'https://…' })
      )
    );
    p.appendChild(social);

    return p;
  }

  function panelInbox() {
    var p = el('section', 'panel');
    p.dataset.panel = 'inbox';

    var list = state.server.submissions || [];
    var total = state.server.submissionsTotal || list.length;

    p.appendChild(
      el(
        'p',
        'panel__intro',
        'İletişim formundan gelen mesajlar. En yeniler üstte. Toplam ' +
          total +
          (total > list.length ? ' kayıt, en yeni ' + list.length + ' tanesi gösteriliyor.' : ' kayıt.')
      )
    );

    if (list.length === 0) {
      p.appendChild(el('div', 'empty', 'Henüz mesaj yok.'));
      return p;
    }

    list.forEach(function (m) {
      var card = el('div', 'msg');

      var head = el('div', 'msg__head');
      var who = el('div');
      who.appendChild(el('div', 'msg__who', m.name + (m.company ? ' · ' + m.company : '')));
      head.appendChild(who);
      head.appendChild(el('span', null, formatDate(m.receivedAt)));
      card.appendChild(head);

      var meta = el('div', 'msg__meta');
      if (m.email) {
        var a = el('a', null, m.email);
        a.href = 'mailto:' + m.email;
        meta.appendChild(a);
      }
      if (m.phone) {
        var t = el('a', null, m.phone);
        t.href = 'tel:' + m.phone.replace(/[^\d+]/g, '');
        meta.appendChild(t);
      }
      card.appendChild(meta);

      // Liste görünümünde önizleme; tam gövde istendiğinde ayrıca çekilir.
      var body = el('p', 'msg__body', m.preview || '');
      card.appendChild(body);

      var actions = el('div', 'card__actions');

      var more = el('button', 'btn-admin btn-admin--ghost btn-admin--small', 'TAMAMINI GÖR');
      more.type = 'button';
      more.addEventListener('click', function () {
        more.disabled = true;
        more.textContent = 'YÜKLENİYOR…';
        api('/api/admin/content?mesaj=' + encodeURIComponent(m.key)).then(function (res) {
          if (res.ok && res.data.ok) {
            body.textContent = res.data.data.submission.message;
            more.remove();
          } else {
            more.disabled = false;
            more.textContent = 'TAMAMINI GÖR';
          }
        });
      });
      if ((m.preview || '').length >= 160) actions.appendChild(more);

      var del = el('button', 'btn-admin btn-admin--danger btn-admin--small', 'SİL');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('Bu mesaj kalıcı olarak silinecek. Onaylıyor musun?')) return;
        del.disabled = true;

        api('/api/admin/content?mesaj=' + encodeURIComponent(m.key), { method: 'DELETE' }).then(
          function (res) {
            if (res.ok && res.data.ok) {
              // Tüm içeriği yeniden çekmek yerine kaydı yerel listeden düşür.
              // WAF hız sınırı /api/* için IP başına 5 istek/10 sn olduğundan
              // silme başına 2 istek harcamak arka arkaya silmeyi bloklatıyordu.
              var drop = function (arr) {
                var i = (arr || []).findIndex(function (x) { return x.key === m.key; });
                if (i >= 0) arr.splice(i, 1);
              };
              drop(state.server.submissions);
              drop(state.draft.submissions);
              if (typeof state.server.submissionsTotal === 'number') {
                state.server.submissionsTotal -= 1;
              }
              render();
              return;
            }

            del.disabled = false;
            window.alert(describeError(res, 'Mesaj silinemedi.'));
          }
        );
      });
      actions.appendChild(del);

      card.appendChild(actions);
      p.appendChild(card);
    });

    return p;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) {
      return iso;
    }
  }

  function moveBtn(label, list, index, delta, _rerender) {
    var b = el('button', 'btn-admin btn-admin--ghost btn-admin--small', label);
    b.type = 'button';
    b.addEventListener('click', function () {
      var target = index + delta;
      var tmp = list[index];
      list[index] = list[target];
      list[target] = tmp;
      render();
      touched();
    });
    return b;
  }

  /* --- SEO paneli --------------------------------------------------------- */
  /*
   * SEO dokümanları panel açılışında DEĞİL, bu sekme ilk kez açıldığında
   * çekilir (ayrı endpoint: /api/admin/seo). Böylece sadece hero metnini
   * düzenlemeye gelen biri gereksiz KV okuması doğurmaz.
   */

  var SEO_SECTION_LABELS = {
    home: 'ANA SAYFA',
    'why-us': 'NEDEN BİZ',
    services: 'HİZMETLER',
    contact: 'İLETİŞİM',
  };

  function seoDirty() {
    if (!state.seo.server) return false;
    return JSON.stringify(state.seo.server) !== JSON.stringify(state.seo.draft);
  }

  /** Kaydedilecek dokümanlar: yalnızca DEĞİŞENLER (KV yazma bütçesi). */
  function seoChanges() {
    var out = { sections: {}, products: {} };
    if (!state.seo.server) return out;

    Object.keys(state.seo.draft.sections).forEach(function (name) {
      var a = JSON.stringify(state.seo.server.sections[name]);
      var b = JSON.stringify(state.seo.draft.sections[name]);
      if (a !== b) out.sections[name] = state.seo.draft.sections[name];
    });
    Object.keys(state.seo.draft.products).forEach(function (id) {
      var a = JSON.stringify(state.seo.server.products[id]);
      var b = JSON.stringify(state.seo.draft.products[id]);
      if (a !== b) out.products[id] = state.seo.draft.products[id];
    });
    return out;
  }

  /** Bozuk JSON-LD varsa kaydetmeyi engelleriz; hangi sekmede olduğunu döner. */
  function seoJsonErrors() {
    var bad = [];
    if (!state.seo.draft) return bad;

    var check = function (doc, label) {
      if (!doc || typeof doc.jsonLd !== 'string') return;
      var raw = doc.jsonLd.trim();
      if (!raw) return;
      try {
        JSON.parse(raw);
      } catch (e) {
        bad.push(label);
      }
    };
    Object.keys(state.seo.draft.sections).forEach(function (n) {
      check(state.seo.draft.sections[n], SEO_SECTION_LABELS[n] || n);
    });
    Object.keys(state.seo.draft.products).forEach(function (id) {
      check(state.seo.draft.products[id], 'ÜRÜN: ' + id);
    });
    return bad;
  }

  function seoSubtabs() {
    var bar = el('div', 'subtabs');

    var add = function (key, label) {
      var b = el('button', 'subtab', label);
      b.type = 'button';
      if (state.seo.sub === key) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () {
        state.seo.sub = key;
        render();
      });
      bar.appendChild(b);
    };

    Object.keys(SEO_SECTION_LABELS).forEach(function (name) {
      if (state.seo.draft.sections[name]) add('s:' + name, SEO_SECTION_LABELS[name]);
    });
    (state.seo.productIndex || []).forEach(function (p) {
      add('p:' + p.id, (p.name || p.id).toLocaleUpperCase('tr-TR'));
    });

    return bar;
  }

  /** Bir SEO dokümanı için alan grubu. */
  function seoDocCard(doc, opts) {
    var card = el('section', 'card');
    card.appendChild(el('p', 'card__title', opts.title));

    if (opts.notice) card.appendChild(el('p', 'panel__intro', opts.notice));

    card.appendChild(
      field('SAYFA BAŞLIĞI (title)', doc.pageTitle, function (v) { doc.pageTitle = v; }, {
        counter: 60,
        maxlength: 120,
        hint: 'Arama sonucunda görünen mavi başlık.',
      })
    );

    card.appendChild(
      field('META AÇIKLAMA', doc.metaDescription, function (v) { doc.metaDescription = v; }, {
        multiline: true,
        rows: 3,
        counter: { max: 160, min: 100 },
        maxlength: 320,
        hint:
          'Arama sonucunda başlığın altındaki gri metin. OG açıklaması boşsa ' +
          'sosyal medya paylaşımlarında da bu kullanılır.',
      })
    );

    card.appendChild(
      row2(
        field('OG BAŞLIK', doc.ogTitle, function (v) { doc.ogTitle = v; }, {
          maxlength: 120,
          hint: 'Boşsa sayfa başlığı kullanılır.',
        }),
        field('OG GÖRSEL', doc.ogImage, function (v) { doc.ogImage = v; }, {
          maxlength: 300,
          hint: 'Boşsa /images/og-default.jpg kullanılır.',
        })
      )
    );

    card.appendChild(
      // og:description doğrudan buradan gelir; LinkedIn'in 100 karakter
      // uyarısını asıl tetikleyen alan budur.
      field('OG AÇIKLAMA', doc.ogDescription, function (v) { doc.ogDescription = v; }, {
        multiline: true,
        rows: 3,
        counter: { max: 160, min: 100 },
        maxlength: 320,
        hint: 'Sosyal medya paylaşımında görünen metin. Boşsa meta açıklama kullanılır.',
      })
    );

    card.appendChild(
      field('CANONICAL URL', doc.canonical, function (v) { doc.canonical = v; }, {
        maxlength: 300,
        hint: 'Boşsa sayfanın kendi adresi kullanılır.',
      })
    );

    return card;
  }

  /** JSON-LD ham düzenleme kartı — canlı doğrulamalı. */
  function seoJsonCard(doc, opts) {
    var card = el('section', 'card');
    card.appendChild(el('p', 'card__title', 'JSON-LD — GELİŞMİŞ'));
    card.appendChild(el('p', 'panel__intro', opts.notice));

    var wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field__label', 'HAM JSON'));

    var input = el('textarea', 'field__textarea');
    input.rows = 10;
    input.spellcheck = false;
    input.placeholder = '{ "@context": "https://schema.org", "@type": "FAQPage", … }';
    input.value =
      doc.jsonLd === null || doc.jsonLd === undefined
        ? ''
        : typeof doc.jsonLd === 'string'
          ? doc.jsonLd
          : JSON.stringify(doc.jsonLd, null, 2);

    var status = el('p', 'field__hint');

    var validate = function () {
      var raw = input.value.trim();
      if (!raw) {
        status.textContent = 'Boş — otomatik üretilen şema kullanılır.';
        status.className = 'field__hint';
        wrap.classList.remove('field--invalid');
        return true;
      }
      try {
        JSON.parse(raw);
        status.textContent = 'Geçerli JSON ✓';
        status.className = 'field__hint field__hint--ok';
        wrap.classList.remove('field--invalid');
        return true;
      } catch (e) {
        status.textContent = 'Geçersiz JSON: ' + e.message;
        status.className = 'field__hint field__hint--error';
        wrap.classList.add('field--invalid');
        return false;
      }
    };

    input.addEventListener('input', function () {
      // Ham metni saklıyoruz: yarım kalmış bir düzenleme kaybolmasın.
      doc.jsonLd = input.value;
      validate();
      touched();
    });

    validate();

    wrap.appendChild(input);
    wrap.appendChild(status);
    card.appendChild(wrap);

    var format = el('button', 'btn-admin btn-admin--ghost btn-admin--small', 'JSON’U DÜZENLE (format)');
    format.type = 'button';
    format.addEventListener('click', function () {
      var raw = input.value.trim();
      if (!raw) return;
      try {
        input.value = JSON.stringify(JSON.parse(raw), null, 2);
        doc.jsonLd = input.value;
        validate();
        touched();
      } catch (e) {
        validate();
      }
    });

    var actions = el('div', 'card__actions');
    actions.appendChild(format);
    card.appendChild(actions);

    return card;
  }

  function panelSeo() {
    var p = el('section', 'panel');

    if (state.seo.error) {
      p.appendChild(el('div', 'alert alert--error', state.seo.error));

      var retry = el('button', 'btn-admin btn-admin--ghost', 'TEKRAR DENE');
      retry.type = 'button';
      retry.addEventListener('click', function () {
        state.seo.error = '';
        render();
      });

      var box = el('div', 'card__actions');
      box.appendChild(retry);
      p.appendChild(box);
      return p;
    }
    if (!state.seo.draft) {
      p.appendChild(el('p', 'loading', 'SEO ayarları yükleniyor…'));
      loadSeo();
      return p;
    }

    p.appendChild(
      el(
        'p',
        'panel__intro',
        'Arama motoru ve sosyal medya çıktısı. Değişiklikler kaydedildiği anda ' +
          'sitede yayına girer; yeniden deploy gerekmez.'
      )
    );

    p.appendChild(seoSubtabs());

    var sub = state.seo.sub || 's:home';
    var kind = sub.slice(0, 1);
    var key = sub.slice(2);

    if (kind === 's') {
      var doc = state.seo.draft.sections[key];
      if (!doc) {
        p.appendChild(el('div', 'alert alert--error', 'Bölüm bulunamadı.'));
        return p;
      }

      if (key === 'home') {
        p.appendChild(
          seoDocCard(doc, { title: 'ANA SAYFA — CANLI META ETİKETLERİ' })
        );
        p.appendChild(
          seoJsonCard(doc, {
            notice:
              'Doldurulursa sayfanın TÜM yapısal verisini bu değiştirir — ' +
              'otomatik üretilen Organization ve Service blokları devre dışı kalır.',
          })
        );
      } else {
        p.appendChild(
          seoDocCard(doc, {
            title: SEO_SECTION_LABELS[key] + ' — META ALANLARI',
            notice:
              'Site tek sayfa olduğu için bu bölümün başlık/açıklama alanları ' +
              'şu an sayfaya YANSIMAZ; yalnızca aşağıdaki JSON-LD canlıdır. ' +
              'Alanlar, bölüm ileride kendi sayfasına ayrılırsa kullanılmak üzere saklanır.',
          })
        );
        p.appendChild(
          seoJsonCard(doc, {
            notice: 'Doldurulursa sayfanın yapısal veri grafiğine ek blok olarak eklenir.',
          })
        );
      }
    } else {
      var pdoc = state.seo.draft.products[key];
      if (!pdoc) {
        p.appendChild(el('div', 'alert alert--error', 'Ürün bulunamadı.'));
        return p;
      }
      p.appendChild(
        seoDocCard(pdoc, {
          title: 'ÜRÜN: ' + key,
          notice:
            'Tek sayfalık sitede ürünlerin ayrı bir adresi yok; bu alanlar ' +
            'şu an sayfaya yansımaz. Canlı olan yalnızca aşağıdaki JSON-LD’dir.',
        })
      );
      p.appendChild(
        seoJsonCard(pdoc, {
          notice:
            'Doldurulursa bu ürün için otomatik üretilen Service bloğunun ' +
            'yerine geçer. Boş bırakılırsa ürünün kendi alanlarından üretilir.',
        })
      );
    }

    return p;
  }

  /* --- Hesap paneli ------------------------------------------------------- */
  /*
   * Şifre değiştirme iki istekte yapılır (bkz. functions/api/admin/password.js):
   * doğrula → uygula. Tek istekte iki PBKDF2 çalıştırmak Workers'ın CPU
   * limitini zorluyor.
   *
   * Şifreler state'e YAZILMAZ; yalnızca bu kapanışın içinde yaşar ve işlem
   * biter bitmez alanlar temizlenir.
   */
  function panelAccount() {
    var p = el('section', 'panel');

    p.appendChild(
      el(
        'p',
        'panel__intro',
        'Yönetici hesabı. Şifre değiştirmek için önce mevcut şifrenizi doğrulamanız gerekir.'
      )
    );

    var card = el('section', 'card');
    card.appendChild(el('p', 'card__title', 'ŞİFRE DEĞİŞTİR'));

    var alert = el('p', 'alert');
    alert.style.display = 'none';

    var current = passwordInput('MEVCUT ŞİFRE', 'current-password');
    var next = passwordInput('YENİ ŞİFRE (en az 12 karakter)', 'new-password');
    var again = passwordInput('YENİ ŞİFRE (tekrar)', 'new-password');

    card.appendChild(current.wrap);
    card.appendChild(row2(next.wrap, again.wrap));

    var btn = el('button', 'btn-admin', 'ŞİFREYİ DEĞİŞTİR');
    btn.type = 'button';

    var show = function (message, kind) {
      alert.style.display = '';
      alert.textContent = message;
      alert.className = 'alert' + (kind ? ' alert--' + kind : '');
    };

    btn.addEventListener('click', function () {
      var cur = current.input.value;
      var a = next.input.value;
      var b = again.input.value;

      if (!cur) return show('Mevcut şifrenizi girin.', 'error');
      if (a.length < 12) return show('Yeni şifre en az 12 karakter olmalı.', 'error');
      if (a !== b) return show('Yeni şifreler birbiriyle eşleşmiyor.', 'error');
      if (a === cur) return show('Yeni şifre mevcut şifreyle aynı olamaz.', 'error');

      btn.disabled = true;
      show('Doğrulanıyor…', null);

      api('/api/admin/password', { method: 'POST', body: { step: 'dogrula', currentPassword: cur } })
        .then(function (res) {
          if (res.status === 401 && res.data && res.data.reason) {
            window.location.href = '/admin/login';
            return null;
          }
          if (!res.ok || !res.data.ok) {
            show(describeError(res, 'Mevcut şifre doğrulanamadı.'), 'error');
            return null;
          }
          show('Yeni şifre kaydediliyor…', null);
          return api('/api/admin/password', {
            method: 'POST',
            body: { step: 'uygula', token: res.data.token, newPassword: a },
          });
        })
        .then(function (res) {
          btn.disabled = false;
          if (!res) return;

          if (!res.ok || !res.data.ok) {
            show(describeError(res, 'Şifre değiştirilemedi.'), 'error');
            return;
          }

          current.input.value = '';
          next.input.value = '';
          again.input.value = '';
          show(
            'Şifre değiştirildi. Bu oturum açık kalır; diğer cihazlarda ' +
              'yeni şifreyle giriş yapmanız gerekir.',
            'ok'
          );
        })
        .catch(function () {
          btn.disabled = false;
          show('Bağlantı kurulamadı.', 'error');
        });
    });

    var actions = el('div', 'card__actions');
    actions.appendChild(btn);
    card.appendChild(actions);
    card.appendChild(alert);

    p.appendChild(card);
    return p;
  }

  function passwordInput(labelText, autocomplete) {
    // Giriş ekranıyla aynı yapı: .field > .field__pw > input, düğmeyi
    // enhancePasswordFields() ekler.
    var wrap = el('div', 'field');
    wrap.appendChild(el('span', 'field__label', labelText));

    var box = el('span', 'field__pw');
    var input = el('input', 'field__input');
    input.type = 'password';
    input.autocomplete = autocomplete;
    input.maxLength = 200;

    box.appendChild(input);
    wrap.appendChild(box);
    return { wrap: wrap, input: input };
  }

  /* --- render --- */

  var BUILDERS = {
    hero: panelHero,
    why: panelWhy,
    products: panelProducts,
    contact: panelContact,
    seo: panelSeo,
    inbox: panelInbox,
    account: panelAccount,
  };

  function render() {
    app.textContent = '';
    app.removeAttribute('aria-busy');

    var panel = BUILDERS[state.panel]();
    panel.dataset.active = 'true';
    app.appendChild(panel);

    // HESAP sekmesindeki şifre alanlarına göster/gizle düğmesi ekle.
    // Her render'da çağrılır; zaten işlenmiş alanlar atlanır.
    enhancePasswordFields(panel);

    document.querySelectorAll('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.dataset.panel === state.panel ? 'true' : 'false');
    });
  }

  // Sekme URL'de tutulur: yenileyince aynı sekme açılır, bağlantı paylaşılabilir.
  function panelFromHash() {
    var name = (location.hash || '').replace('#', '');
    return BUILDERS[name] ? name : 'hero';
  }

  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.panel = tab.dataset.panel;
      location.hash = state.panel;
      render();
    });
  });

  window.addEventListener('hashchange', function () {
    var next = panelFromHash();
    if (next === state.panel) return;
    state.panel = next;
    render();
  });

  /* --- yükle / kaydet --- */

  function loadSeo() {
    if (state.seo.loading) return;
    state.seo.loading = true;

    api('/api/admin/seo')
      .then(function (res) {
        state.seo.loading = false;

        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok || !res.data.ok) {
          state.seo.error = describeError(res, 'SEO ayarları yüklenemedi.');
          render();
          return;
        }

        var d = res.data.data;
        state.seo.error = '';
        state.seo.productIndex = d.productIndex || [];
        state.seo.server = { sections: d.sections || {}, products: d.products || {} };
        state.seo.draft = clone(state.seo.server);
        render();
      })
      .catch(function () {
        state.seo.loading = false;
        state.seo.error = 'Bağlantı kurulamadı.';
        render();
      });
  }

  function load() {
    return api('/api/admin/content').then(function (res) {
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok || !res.data.ok) {
        app.textContent = '';
        app.appendChild(el('div', 'alert alert--error', res.data.error || 'İçerik yüklenemedi.'));
        return;
      }

      var d = res.data.data;
      d.whyUs = Array.isArray(d.whyUs) ? d.whyUs : [];
      d.products = Array.isArray(d.products) ? d.products : [];
      d.hero = d.hero || {};
      d.contact = d.contact || {};

      state.server = d;
      state.draft = clone(d);
      state.panel = panelFromHash();
      render();
      refreshSavebar();
    });
  }

  function saveSeo() {
    var changes = seoChanges();
    if (Object.keys(changes.sections).length === 0 && Object.keys(changes.products).length === 0) {
      return Promise.resolve(true);
    }

    return api('/api/admin/seo', { method: 'PUT', body: changes }).then(function (res) {
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return false;
      }
      if (!res.ok || !res.data.ok) {
        var detail = '';
        if (res.data && res.data.errors) {
          detail = ' (' + Object.keys(res.data.errors).join(', ') + ')';
        }
        refreshSavebar(describeError(res, 'SEO kaydedilemedi.') + detail, 'error');
        return false;
      }

      // Endpoint doğrulanmış hali döndürüyor; yeniden GET atmıyoruz
      // (WAF: /api/* için IP başına 5 istek / 10 saniye).
      var saved = res.data.data || {};
      Object.keys(saved.sections || {}).forEach(function (n) {
        state.seo.server.sections[n] = saved.sections[n];
        state.seo.draft.sections[n] = clone(saved.sections[n]);
      });
      Object.keys(saved.products || {}).forEach(function (id) {
        state.seo.server.products[id] = saved.products[id];
        state.seo.draft.products[id] = clone(saved.products[id]);
      });
      return true;
    });
  }

  function saveContent() {
    if (!contentDirty()) return Promise.resolve(true);

    return api('/api/admin/content', {
      method: 'PUT',
      body: {
        hero: state.draft.hero,
        whyUs: state.draft.whyUs,
        products: state.draft.products,
        contact: state.draft.contact,
      },
    }).then(function (res) {
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return false;
      }
      if (!res.ok || !res.data.ok) {
        refreshSavebar(describeError(res, 'Kaydedilemedi.'), 'error');
        return false;
      }

      // Endpoint doğrulanmış (temizlenmiş) hâli döndürüyor; yeniden GET
      // atmıyoruz — WAF /api/* için IP başına 5 istek / 10 saniye veriyor.
      var saved = res.data.data || {};
      Object.keys(saved).forEach(function (key) {
        state.server[key] = saved[key];
        state.draft[key] = clone(saved[key]);
      });
      return true;
    });
  }

  saveBtn.addEventListener('click', function () {
    // Bozuk JSON-LD ile kaydetmeye izin verilmez: sunucu zaten reddediyor,
    // ama kullanıcıya sekme adıyla birlikte daha net söylüyoruz.
    var bad = seoJsonErrors();
    if (bad.length) {
      refreshSavebar('Geçersiz JSON-LD: ' + bad.join(', ') + '. Kaydedilmedi.', 'error');
      return;
    }

    saveBtn.disabled = true;
    refreshSavebar('Kaydediliyor…', null);

    saveContent()
      .then(function (ok) {
        if (!ok) return false;
        return saveSeo();
      })
      .then(function (ok) {
        saveBtn.disabled = false;
        if (!ok) return;
        render();
        refreshSavebar('Kaydedildi. Değişiklikler sitede yayında.', 'ok');
        setTimeout(refreshSavebar, 4000);
      })
      .catch(function () {
        saveBtn.disabled = false;
        refreshSavebar('Bağlantı kurulamadı.', 'error');
      });
  });

  discardBtn.addEventListener('click', function () {
    state.draft = clone(state.server);
    if (state.seo.server) state.seo.draft = clone(state.seo.server);
    render();
    refreshSavebar();
  });

  document.getElementById('logout').addEventListener('click', function () {
    api('/api/admin/logout', { method: 'POST' }).then(function () {
      window.location.href = '/admin/login';
    });
  });

  window.addEventListener('beforeunload', function (e) {
    if (!isDirty()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  load();
})();
