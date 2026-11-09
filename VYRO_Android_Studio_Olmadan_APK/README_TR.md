# VYRO Android — Başlangıç paketi

Bu ZIP, Stitch'ten gelen 9 tasarım ekranını korur ve bunların yanında Android'e paketlenebilen çalışan bir başlangıç uygulaması sunar.

## Gerçekçi durum
- Uygulama kabuğu, sayfa geçişleri, e-posta ile kayıt/giriş, video yükleme/oynatma, beğeni, yorum, keşfet ve seri listeleme kodları dahildir.
- Gerçek çok kullanıcılı kullanım için kendi ücretsiz Supabase projenin URL ve anon key değerlerini eklemelisin.
- Ücretsiz servislerin kota ve dosya sınırları vardır. Sınırsız video depolama veya sınırsız canlı yayın ücretsiz değildir.
- Canlı yayın ekranı şimdilik açıkça hazırlık durumundadır; gerçek yayın için ayrıca LiveKit/başka bir WebRTC sunucusu entegrasyonu gerekir.
- Mesajlaşma, tam takipçi sayıları, video zinciri oluşturma arayüzü, gelişmiş öneri algoritması ve yönetici moderasyon paneli bu ilk başlangıç sürümünde tamamlanmış değildir.
- APK bu ZIP'in içinde hazır değildir; Android SDK bulunan bir bilgisayarda derlenir.

## 1. Ücretsiz Supabase projesi oluştur
1. https://supabase.com adresinde hesap aç.
2. Yeni proje oluştur. Bölge olarak sana yakın bir bölge seç.
3. Proje açılınca Project Settings > API bölümünden Project URL ve anon/public key değerlerini al.
4. `www/config.js` dosyasını metin düzenleyiciyle aç ve iki alanı doldur.
5. `supabase/schema.sql` dosyasının tamamını Supabase Dashboard > SQL Editor içine yapıştırıp Run'a bas.
6. Authentication > Providers > Email bölümünde e-posta girişini etkin tut. İlk test için e-posta doğrulamasını açık bırakman önerilir.
7. Database > Replication / Publications kısmında `videos` tablosu için Realtime'ı etkinleştir.

**Güvenlik:** `service_role` anahtarını uygulamaya veya ZIP'e ASLA koyma. Sadece anon/public key kullan. SQL içindeki RLS politikalarını kapatma.

## 2. Windows'ta Android APK hazırlığı
Gerekenler:
- Node.js LTS
- Android Studio (Android SDK ve Platform Tools bileşenleri)
- JDK 17 (Android Studio'nun gömülü JDK'sı kullanılabilir)

1. ZIP'i örneğin `C:\\VYRO` klasörüne çıkar.
2. Bu klasörde terminal/CMD aç.
3. Komutları sırayla çalıştır:

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

4. Android Studio açılınca Gradle senkronizasyonunun bitmesini bekle.
5. Test için telefonunu USB hata ayıklama ile bağlayıp Run'a basabilir veya Build > Build Bundle(s) / APK(s) > Build APK(s) seçebilirsin.
6. APK genellikle `android/app/build/outputs/apk/debug/app-debug.apk` konumunda oluşur.
7. APK'yı telefona aktar ve kur. Telefonda yalnızca güvendiğin kaynaktan aldığın APK'ları kur.

## 3. Her kod değişikliğinden sonra
Proje klasöründe:
```bash
npx cap sync android
```
Sonra Android Studio'da tekrar çalıştır/derle.

## 4. Uptodown'a yükleme
1. Önce debug değil, imzalı release APK üret.
2. Uptodown geliştirici hesabı ve yayın başvuru sürecini kontrol et.
3. Uygulama adı, açıklama, ikon, ekran görüntüleri, gizlilik politikası ve iletişim e-postası hazırla.
4. Uygulama içindeki kullanıcı hesabı silme, raporlama, engelleme ve içerik moderasyonu akışları tamamlanmadan herkese açık yayın yapma.

## 5. Ücretsiz kullanım notları
Supabase ücretsiz katmanıyla prototip ve küçük test yapılabilir; kullanım, depolama, bant genişliği, uyku/aktiflik ve limitler değişebilir. Video uygulamaları bant genişliğini hızlı tüketir. Gerçek kullanıcı sayısı büyüdüğünde ücretsiz plan yeterli olmayabilir. Canlı yayın da ayrıca altyapı ve kota gerektirir.

## Tasarım dosyaları
`www/screens/` içinde Stitch'ten gelen HTML ve ekran görüntüleri korunmuştur. İlk çalışan kabuk `www/index.html` dosyasıdır.


## 6. Android Studio KULLANMADAN APK oluşturma (GitHub Actions)
Bu yöntem Android Studio'yu bilgisayarına kurmadan APK derler. GitHub hesabı ve internet gerekir.

1. ZIP'i çıkar ve GitHub'da yeni, boş bir repository oluştur.
2. Çıkarılan klasördeki tüm dosyaları repository'ye yükle (GitHub web arayüzünden **Add file > Upload files** da kullanabilirsin).
3. `.github/workflows/android.yml` dosyasının da yüklendiğini kontrol et. GitHub web arayüzü gizli `.github` klasörünü göstermeyebilir; dosyayı ayrıca oluşturman gerekirse aynı yol ve içerikle ekle.
4. Repository'de **Actions** sekmesine gir.
5. **VYRO Android APK** iş akışını açıp **Run workflow** seçeneğine bas.
6. İşlem tamamlanınca yeşil başarılı çalışmaya gir.
7. Sayfanın altındaki **Artifacts** bölümünden `VYRO-debug-APK` dosyasını indir.
8. ZIP içindeki `app-debug.apk` dosyasını Android telefona gönderip kur.

Bu debug APK test içindir; mağazaya dağıtılacak imzalı release APK değildir. Telefonda "bilinmeyen uygulamaları yükleme" izni istenebilir. Yalnızca kendi oluşturduğun APK'yı kur.

GitHub Actions ücretsiz kullanım kotasına ve hesap/repository koşullarına tabidir. Build sırasında hata çıkarsa Actions logundaki kırmızı hata metnini gönder.
