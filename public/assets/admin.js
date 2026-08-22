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

  var state = { server: null, draft: null, panel: 'hero' };

  var ICONS = [
    { value: 'roaster', label: 'Kavurma makinesi' },
    { value: 'clock', label: 'Saat / tazelik' },
    { value: 'check', label: 'Onay / kalite' },
    { value: 'leaf', label: 'Yaprak / sürdürülebilirlik' },
  ];

  function isDirty() {
    return state.server && JSON.stringify(state.server) !== JSON.stringify(state.draft);
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

    input.addEventListener('input', function () {
      onInput(input.value);
      touched();
    });

    wrap.appendChild(input);
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

  /* --- render --- */

  var BUILDERS = {
    hero: panelHero,
    why: panelWhy,
    products: panelProducts,
    contact: panelContact,
    inbox: panelInbox,
  };

  function render() {
    app.textContent = '';
    app.removeAttribute('aria-busy');

    var panel = BUILDERS[state.panel]();
    panel.dataset.active = 'true';
    app.appendChild(panel);

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

  saveBtn.addEventListener('click', function () {
    saveBtn.disabled = true;
    refreshSavebar('Kaydediliyor…', null);

    api('/api/admin/content', {
      method: 'PUT',
      body: {
        hero: state.draft.hero,
        whyUs: state.draft.whyUs,
        products: state.draft.products,
        contact: state.draft.contact,
      },
    })
      .then(function (res) {
        saveBtn.disabled = false;

        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok || !res.data.ok) {
          refreshSavebar(describeError(res, 'Kaydedilemedi.'), 'error');
          return;
        }

        // Sunucu doğrulanmış hali döndürmediği için taze veriyi yeniden çekiyoruz;
        // böylece panel KV'deki gerçek (temizlenmiş) içerikle senkron kalır.
        return load().then(function () {
          refreshSavebar('Kaydedildi. Değişiklikler sitede yayında.', 'ok');
          setTimeout(refreshSavebar, 4000);
        });
      })
      .catch(function () {
        saveBtn.disabled = false;
        refreshSavebar('Bağlantı kurulamadı.', 'error');
      });
  });

  discardBtn.addEventListener('click', function () {
    state.draft = clone(state.server);
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
