/**
 * legal.js — KVKK aydınlatma metni ve çerez politikası sayfaları.
 *
 * Bu sayfalar bilinçli olarak Pages Function'dır, `public/` altında statik
 * HTML DEĞİLDİR: Pages'te `functions/_middleware.js` statik varlıkları
 * sarmıyor, dolayısıyla statik bir HTML sayfası CSP ve X-Frame-Options
 * olmadan servis edilirdi (21 Ağustos 2026 denetiminde ölçüldü).
 *
 * İçerik KV'den gelmez: bunlar admin panelinden düzenlenecek pazarlama
 * metni değil, veri sorumlusunun onayladığı hukuki metinlerdir. Değişiklik
 * gerektiğinde bu dosya güncellenir ve `plan-design/legal/` altındaki
 * kaynak taslakla birlikte tutulur.
 */

import { asset } from '../lib/assets.js';

const UPDATED = '22 Ağustos 2026';
const CONTACT = 'halitcenat@meisterkaffee.com.tr';

function shell({ title, description, slug, body, assetVersion }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Meister Kaffee-Rösterei</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://meisterkaffee.com.tr/${slug}">

  <link rel="icon" href="${asset('/images/favicon.png', assetVersion)}" type="image/png">
  <meta name="theme-color" content="#FAF9F6">
  <meta name="color-scheme" content="light">
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${asset('/assets/main.css', assetVersion)}">
</head>
<body>
  <main class="legal">
    <a class="legal__back" href="/">&larr; ANA SAYFAYA DÖN</a>

    <h1 class="legal__title">${title}</h1>
    <p class="legal__updated">SON GÜNCELLEME: ${UPDATED.toLocaleUpperCase('tr-TR')}</p>

${body}
  </main>

  <footer class="footer">
    <p class="footer__copy">© ${new Date().getFullYear()} MEISTER KAFFEERÖSTEREI — TÜM HAKLARI SAKLIDIR</p>
    <p class="footer__links">
      <a href="/kvkk-aydinlatma-metni">KVKK AYDINLATMA METNİ</a>
      <a href="/cerez-politikasi">ÇEREZ POLİTİKASI</a>
    </p>
  </footer>
</body>
</html>
`;
}

/* ---- KVKK Aydınlatma Metni ------------------------------------------------ */

export function renderKvkkPage(assetVersion) {
  const body = `
    <p class="legal__lead">
      6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel
      verileriniz, veri sorumlusu sıfatıyla <strong>Halit Cenat</strong>
      (Meister Kaffee-Rösterei) tarafından aşağıda açıklanan kapsamda işlenmektedir.
    </p>

    <h2>1. Veri Sorumlusu</h2>
    <p>
      <strong>Halit Cenat</strong> — Meister Kaffee-Rösterei<br>
      İletişim: <a href="mailto:${CONTACT}">${CONTACT}</a>
    </p>

    <h2>2. İşlenen Kişisel Verileriniz</h2>
    <p>Web sitemizdeki iletişim formunu doldurmanız hâlinde aşağıdaki veriler işlenir:</p>
    <div class="legal__table-wrap">
      <table>
        <thead>
          <tr><th>Veri</th><th>Zorunlu</th><th>Kaynak</th></tr>
        </thead>
        <tbody>
          <tr><td>Ad Soyad</td><td>Evet</td><td>Formu dolduran kişi</td></tr>
          <tr><td>Firma Adı</td><td>Evet</td><td>Formu dolduran kişi</td></tr>
          <tr><td>E-posta adresi</td><td>Evet</td><td>Formu dolduran kişi</td></tr>
          <tr><td>Telefon numarası</td><td>Hayır</td><td>Formu dolduran kişi</td></tr>
          <tr><td>Mesaj içeriği</td><td>Evet</td><td>Formu dolduran kişi</td></tr>
          <tr><td>Ülke bilgisi</td><td>—</td><td>Bağlantınızdan otomatik türetilir (yalnızca ülke kodu; IP adresi saklanmaz)</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Sitemizde ziyaretçi takibi, analitik veya reklam amaçlı çerez
      <strong>kullanılmamaktadır</strong>. İletişim formu, istenmeyen ileti botlarına
      karşı <strong>Cloudflare Turnstile</strong> güvenlik doğrulamasıyla korunmaktadır;
      bu doğrulama ziyaretçi profili oluşturmaz. Ayrıntı için
      <a href="/cerez-politikasi">Çerez Politikası</a> sayfamıza bakabilirsiniz.
    </p>

    <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
    <p>Verileriniz yalnızca şu amaçlarla işlenir:</p>
    <ul>
      <li>İletişim talebinize ve sorularınıza yanıt verilmesi</li>
      <li>Talep etmeniz hâlinde kurumsal teklif hazırlanması ve iletilmesi</li>
      <li>Ticari ilişkinin kurulması öncesindeki görüşmelerin yürütülmesi</li>
    </ul>
    <p>
      Verileriniz pazarlama, profilleme veya otomatik karar verme amacıyla
      <strong>kullanılmaz</strong>.
    </p>

    <h2>4. Hukuki Sebep</h2>
    <p>Kişisel verileriniz KVKK m.5/2 uyarınca şu hukuki sebeplere dayanılarak işlenir:</p>
    <ul>
      <li><strong>m.5/2-(c):</strong> Bir sözleşmenin kurulması veya ifasıyla doğrudan
        doğruya ilgili olması (teklif talebi hâlinde)</li>
      <li><strong>m.5/2-(f):</strong> Veri sorumlusunun meşru menfaati (kendisine iletilen
        talebe yanıt verebilmesi)</li>
    </ul>
    <p>
      Bu hukuki sebepler geçerli olduğundan iletişim formu için ayrıca
      <strong>açık rızanız alınmamaktadır</strong>; formu göndermeniz bu aydınlatmayı
      okuduğunuz anlamına gelir.
    </p>

    <h2>5. Saklama Süresi</h2>
    <p>
      Form aracılığıyla ilettiğiniz veriler <strong>30 gün</strong> boyunca saklanır ve
      bu sürenin sonunda sistem tarafından <strong>otomatik olarak silinir</strong>.
      Süre dolmadan silinmesini talep edebilirsiniz (bkz. bölüm 7).
    </p>
    <p>
      Ticari bir ilişki kurulması hâlinde, ilgili mevzuatın öngördüğü saklama
      yükümlülükleri (örneğin vergi mevzuatı) ayrıca uygulanabilir.
    </p>

    <h2>6. Kişisel Verilerin Aktarılması</h2>
    <p>
      Verileriniz <strong>hiçbir üçüncü kişiye, kuruma veya iş ortağına satılmaz,
      kiralanmaz veya pazarlama amacıyla aktarılmaz.</strong>
    </p>
    <p>
      Web sitemiz ve verilerin saklandığı altyapı, <strong>Cloudflare, Inc.</strong>
      tarafından sağlanan bulut hizmeti üzerinde çalışmaktadır. Bu nedenle verileriniz
      teknik olarak yurt dışındaki sunucularda barındırılabilmektedir. Cloudflare bu
      kapsamda yalnızca barındırma hizmeti sunan bir veri işleyendir; verilerinize
      kendi amaçları için erişmez.
    </p>

    <h2>7. İlgili Kişi Olarak Haklarınız (KVKK m.11)</h2>
    <p>Kişisel verileriniz bakımından şu haklara sahipsiniz:</p>
    <ul>
      <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme</li>
      <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
      <li>Eksik veya yanlış işlenmiş ise düzeltilmesini isteme</li>
      <li>Silinmesini veya yok edilmesini isteme</li>
      <li>Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
      <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle
        aleyhinize bir sonuç ortaya çıkmasına itiraz etme</li>
      <li>Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini
        talep etme</li>
    </ul>
    <p>
      <strong>Başvuru yolu:</strong> Taleplerinizi
      <a href="mailto:${CONTACT}">${CONTACT}</a> adresine iletebilirsiniz.
      Başvurularınız en geç <strong>30 gün</strong> içinde sonuçlandırılır.
    </p>

    <h2>8. Veri Güvenliği</h2>
    <ul>
      <li>Site tamamen HTTPS üzerinden yayınlanır.</li>
      <li>Yönetim paneli parola korumalıdır; parolalar geri döndürülemez biçimde
        (PBKDF2-SHA256 + sunucu tarafı gizli anahtar) saklanır.</li>
      <li>Form verilerine yalnızca veri sorumlusu erişebilir.</li>
      <li>IP adresiniz kaydedilmez; yalnızca ülke kodu düzeyinde bilgi tutulur.</li>
    </ul>
  `;

  return shell({ assetVersion,
    title: 'KVKK Aydınlatma Metni',
    description:
      'Meister Kaffee-Rösterei iletişim formu aracılığıyla toplanan kişisel verilerin ' +
      'işlenmesine ilişkin KVKK aydınlatma metni.',
    slug: 'kvkk-aydinlatma-metni',
    body,
  });
}

/* ---- Çerez Politikası ----------------------------------------------------- */

export function renderCookiePage(assetVersion) {
  const body = `
    <p class="legal__lead">
      <strong>Bu sitede ziyaretçi takibi yapılmamaktadır.</strong> Google Analytics,
      Meta Pixel, reklam ağı veya benzeri hiçbir izleme aracı kullanılmaz; hiçbir
      pazarlama veya analitik çerezi yerleştirilmez. Sitede yalnızca
      <strong>güvenlik amaçlı, kesinlikle zorunlu</strong> teknolojiler bulunur ve
      bunlar da davranışınızı ölçmez.
    </p>

    <h2>1. Çerez Nedir</h2>
    <p>
      Çerezler, ziyaret ettiğiniz siteler tarafından tarayıcınıza kaydedilen küçük metin
      dosyalarıdır. Oturum bilgisi tutmak, tercihleri hatırlamak veya kullanıcı davranışını
      ölçmek için kullanılabilirler.
    </p>

    <h2>2. Bu Sitede Kullanılan Çerezler</h2>

    <h3>2.1 Ziyaretçiler için: pazarlama/analitik çerezi yok</h3>
    <p>
      Sitenin herkese açık sayfalarında <strong>tarafımızca hiçbir çerez
      yerleştirilmez.</strong> Sayfa içeriği, yazı tipleri ve görseller doğrudan kendi
      sunucumuzdan gelir. Tek istisna, iletişim formundaki güvenlik doğrulamasıdır
      (bkz. 2.2).
    </p>

    <h3>2.2 İletişim formu güvenlik doğrulaması — Cloudflare Turnstile</h3>
    <p>
      İletişim formunun istenmeyen ileti (spam) botları tarafından kötüye kullanılmasını
      önlemek için <strong>Cloudflare Turnstile</strong> kullanılmaktadır. Turnstile,
      formun bulunduğu sayfada Cloudflare'e ait küçük bir çerçeve (iframe) çalıştırır ve
      isteğin bir bottan gelip gelmediğini değerlendirir.
    </p>
    <p>
      Bu teknoloji <strong>kesinlikle zorunlu</strong> kategorisindedir: güvenlik amacı
      taşır, ziyaretçi davranışını izlemez, reklam veya profilleme için kullanılmaz ve
      elde edilen bilgi tarafımızca okunmaz. Turnstile, <em>clearance</em> (site geneli
      erişim) çerezi vermeyecek şekilde yapılandırılmıştır. Çalışma sırasında tarayıcınızda
      teknik nitelikte veri saklayabilir; bu veri yalnızca doğrulama amacıyla kullanılır.
    </p>
    <p>
      Turnstile, gizliliği önceleyecek biçimde tasarlanmıştır ve klasik CAPTCHA
      çözümlerinin aksine ziyaretçi profili oluşturmaz.
    </p>

    <h3>2.3 Yönetim paneli için: iki zorunlu çerez</h3>
    <p>
      Yalnızca site yöneticisi <code>/admin</code> adresinden giriş yaptığında, teknik
      olarak zorunlu iki çerez kullanılır:
    </p>
    <div class="legal__table-wrap">
      <table>
        <thead>
          <tr><th>Çerez</th><th>Amaç</th><th>Süre</th><th>Özellikler</th></tr>
        </thead>
        <tbody>
          <tr><td>mk_session</td><td>Yönetici oturumunu sürdürmek</td><td>8 saat</td><td>HttpOnly, Secure, SameSite=Strict</td></tr>
          <tr><td>mk_csrf</td><td>Sahte istek (CSRF) saldırılarını önlemek</td><td>8 saat</td><td>Secure, SameSite=Strict</td></tr>
        </tbody>
      </table>
    </div>
    <p>
      Bu çerezler <strong>kesinlikle zorunlu</strong> çerez kategorisindedir: oturum
      güvenliği için gereklidirler, ziyaretçi davranışı ölçmezler ve üçüncü taraflarla
      paylaşılmazlar. Bu nedenle önceden rıza alınması gerekmez. Normal ziyaretçiler bu
      çerezlerle hiçbir zaman karşılaşmaz.
    </p>

    <h3>2.4 Altyapı kaynaklı çerezler</h3>
    <p>
      Sitemiz Cloudflare altyapısı üzerinde yayınlanmaktadır. Güvenlik ve bot koruması
      amacıyla, saldırı şüphesi gibi durumlarda Cloudflare tarafından teknik nitelikte
      çerezler (örneğin <code>__cf_bm</code>) bırakılabilir. Bu çerezler tarafımızca
      okunmaz ve pazarlama amacıyla kullanılmaz.
    </p>

    <h2>3. Çerezleri Yönetme</h2>
    <p>
      Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Sitenin
      herkese açık bölümleri çerez kullanmadığı için, çerezleri engellemeniz site
      deneyiminizi hiçbir şekilde etkilemez.
    </p>

    <h2>4. İleride Değişiklik Olursa</h2>
    <p>İleride analitik veya pazarlama amaçlı bir araç eklenmesi hâlinde:</p>
    <ul>
      <li>Bu politika güncellenecek,</li>
      <li>Zorunlu olmayan çerezler için <strong>açık rızanız alınmadan hiçbir çerez
        yerleştirilmeyecek</strong>,</li>
      <li>Rıza yönetimi için bir çerez tercih paneli sunulacaktır.</li>
    </ul>

    <h2>5. İletişim</h2>
    <p>
      Çerez kullanımı ve kişisel verilerinizle ilgili sorularınız için:
      <a href="mailto:${CONTACT}">${CONTACT}</a>
    </p>
    <p>
      Kişisel verilerinizin işlenmesine ilişkin ayrıntılı bilgi için
      <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> sayfamıza bakınız.
    </p>
  `;

  return shell({ assetVersion,
    title: 'Çerez Politikası',
    description:
      'Meister Kaffee-Rösterei çerez politikası: ziyaretçi takibi yapılmaz, herkese açık ' +
      'sayfalarda çerez kullanılmaz.',
    slug: 'cerez-politikasi',
    body,
  });
}
