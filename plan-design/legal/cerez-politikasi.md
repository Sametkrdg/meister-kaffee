# Çerez Politikası — yayındaki metnin birebir kopyası

> ## ONAYLANDI VE YAYINDA — 21 Ağustos 2026
>
> https://meisterkaffee.com.tr/cerez-politikasi adresinde yayında olan sürümün
> birebir kopyasıdır. Kaynağı `src/templates/legal.js`; değişiklik önce orada
> yapılmalı, sonra bu kopya eşitlenmelidir.

---

## Çerez Politikası

### 1. Kısaca

**Bu sitede ziyaretçi takibi yapılmamaktadır.** Siteyi normal bir ziyaretçi
olarak gezdiğinizde tarayıcınıza **hiçbir çerez bırakılmaz**. Google Analytics,
Meta Pixel, reklam ağı veya benzeri hiçbir üçüncü taraf izleme aracı
kullanılmamaktadır.

### 2. Çerez Nedir

Çerezler, ziyaret ettiğiniz siteler tarafından tarayıcınıza kaydedilen küçük
metin dosyalarıdır. Oturum bilgisi tutmak, tercihleri hatırlamak veya kullanıcı
davranışını ölçmek için kullanılabilirler.

### 3. Bu Sitede Kullanılan Çerezler

#### 3.1 Ziyaretçiler için: yok

Sitenin herkese açık sayfalarında **hiçbir çerez kullanılmaz.** Sayfa içeriği,
yazı tipleri ve görseller doğrudan kendi sunucumuzdan gelir; harici bir alan
adına istek yapılmaz.

#### 3.2 Yönetim paneli için: iki zorunlu çerez

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

#### 3.3 Altyapı kaynaklı çerezler

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

*Bu metin en son 21 Ağustos 2026 tarihinde güncellenmiştir.*

---
---

# İNCELEME NOTU — SİTEDE YAYINLANMIYOR

Metindeki teknik iddialar 21 Ağustos 2026 tarihli denetimde canlı site üzerinde
**ölçülerek** doğrulanmıştır: normal bir ziyarette hiçbir çerez gözlenmemiş,
kod tabanında hiçbir analitik/izleme aracı bulunmamıştır. Sitede tespit edilen
tek harici script, Cloudflare Email Obfuscation özelliğine ait olup birinci
taraftır ve çerez bırakmaz.
