# Çerez Politikası — yayındaki metnin birebir kopyası

> ## ONAYLANDI VE YAYINDA — 21 Ağustos 2026
>
> https://meisterkaffee.com.tr/cerez-politikasi adresinde yayında olan sürümün
> birebir kopyasıdır. Kaynağı `src/templates/legal.js`; değişiklik önce orada
> yapılmalı, sonra bu kopya eşitlenmelidir.

---

## Çerez Politikası

### 1. Kısaca

**Bu sitede ziyaretçi takibi yapılmamaktadır.** Google Analytics, Meta Pixel,
reklam ağı veya benzeri hiçbir izleme aracı kullanılmaz; hiçbir pazarlama veya
analitik çerezi yerleştirilmez. Sitede yalnızca **güvenlik amaçlı, kesinlikle
zorunlu** teknolojiler bulunur ve bunlar da davranışınızı ölçmez.

### 2. Çerez Nedir

Çerezler, ziyaret ettiğiniz siteler tarafından tarayıcınıza kaydedilen küçük
metin dosyalarıdır. Oturum bilgisi tutmak, tercihleri hatırlamak veya kullanıcı
davranışını ölçmek için kullanılabilirler.

### 3. Bu Sitede Kullanılan Çerezler

#### 3.1 Ziyaretçiler için: pazarlama/analitik çerezi yok

Sitenin herkese açık sayfalarında **tarafımızca hiçbir çerez yerleştirilmez.**
Sayfa içeriği, yazı tipleri ve görseller doğrudan kendi sunucumuzdan gelir.
Tek istisna, iletişim formundaki güvenlik doğrulamasıdır (bkz. 3.2).

#### 3.2 İletişim formu güvenlik doğrulaması — Cloudflare Turnstile

İletişim formunun istenmeyen ileti (spam) botları tarafından kötüye
kullanılmasını önlemek için **Cloudflare Turnstile** kullanılmaktadır.
Turnstile, formun bulunduğu sayfada Cloudflare'e ait küçük bir çerçeve (iframe)
çalıştırır ve isteğin bir bottan gelip gelmediğini değerlendirir.

Bu teknoloji **kesinlikle zorunlu** kategorisindedir: güvenlik amacı taşır,
ziyaretçi davranışını izlemez, reklam veya profilleme için kullanılmaz ve elde
edilen bilgi tarafımızca okunmaz. Turnstile, *clearance* (site geneli erişim)
çerezi vermeyecek şekilde yapılandırılmıştır. Çalışma sırasında tarayıcınızda
teknik nitelikte veri saklayabilir; bu veri yalnızca doğrulama amacıyla
kullanılır.

Turnstile, gizliliği önceleyecek biçimde tasarlanmıştır ve klasik CAPTCHA
çözümlerinin aksine ziyaretçi profili oluşturmaz.

#### 3.3 Yönetim paneli için: iki zorunlu çerez

Yalnızca site yöneticisi `/admin` adresinden giriş yaptığında, teknik olarak
zorunlu iki çerez kullanılır:

| Çerez | Amaç | Süre | Özellikler |
|---|---|---|---|
| `mk_session` | Yönetici oturumunu sürdürmek | 8 saat | HttpOnly, Secure, SameSite=Strict |
| `mk_csrf` | Sahte istek (CSRF) saldırılarını önlemek | 8 saat | Secure, SameSite=Strict |

Bu çerezler **kesinlikle zorunlu** çerez kategorisindedir: oturum güvenliği
için gereklidirler, ziyaretçi davranışı ölçmezler ve üçüncü taraflarla
paylaşılmazlar. Bu nedenle önceden rıza alınması gerekmez.

Normal ziyaretçiler bu çerezlerle hiçbir zaman karşılaşmaz.

#### 3.4 Altyapı kaynaklı çerezler

Sitemiz Cloudflare altyapısı üzerinde yayınlanmaktadır. Güvenlik ve bot
koruması amacıyla, saldırı şüphesi gibi durumlarda Cloudflare tarafından
teknik nitelikte çerezler (ör. `__cf_bm`) bırakılabilir. Bu çerezler
tarafımızca okunmaz ve pazarlama amacıyla kullanılmaz.

### 4. Çerezleri Yönetme

Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz.
Sitenin herkese açık bölümleri çerez kullanmadığı için, çerezleri engellemeniz
site deneyiminizi hiçbir şekilde etkilemez.

### 5. İleride Değişiklik Olursa

İleride analitik veya pazarlama amaçlı bir araç eklenmesi hâlinde:

- Bu politika güncellenecek,
- Zorunlu olmayan çerezler için **açık rızanız alınmadan hiçbir çerez
  yerleştirilmeyecek**,
- Rıza yönetimi için bir çerez tercih paneli sunulacaktır.

### 6. İletişim

Çerez kullanımı ve kişisel verilerinizle ilgili sorularınız için:
**halitcenat@meisterkaffee.com.tr**

Kişisel verilerinizin işlenmesine ilişkin ayrıntılı bilgi için
KVKK Aydınlatma Metni'ne bakınız.

---

*Bu metin en son 22 Ağustos 2026 tarihinde güncellenmiştir.*

---
---

# İNCELEME NOTU — SİTEDE YAYINLANMIYOR

Metindeki teknik iddialar 21 Ağustos 2026 tarihli denetimde canlı site üzerinde
**ölçülerek** doğrulanmıştır: normal bir ziyarette hiçbir çerez gözlenmemiş,
kod tabanında hiçbir analitik/izleme aracı bulunmamıştır. Sitede tespit edilen
tek harici script, Cloudflare Email Obfuscation özelliğine ait olup birinci
taraftır ve çerez bırakmaz.
