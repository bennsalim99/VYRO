# VYRO Android — Yerel çalışan prototip

Bu sürüm, GitHub Actions ile Android APK olarak derlenebilen Capacitor uygulamasıdır.

## Bu sürümde gerçekten çalışanlar
- Alt menü ve ekran geçişleri
- Yerel profil adı (bu cihazda saklanır; çevrimiçi hesap değildir)
- Keşfet araması ve filtreleri
- Demo akış kartları
- Beğeni, yorum, takip ve paylaşım metni (bu cihazda saklanır)
- Galeriden video seçme, önizleme, cihazın IndexedDB alanına kaydetme ve tekrar oynatma
- Yerel seri oluşturma/silme
- Canlı ekranında kamera/mikrofon izni isteme, cihaz önizlemesi ve kameralar arasında geçiş

## Bu sürümde henüz çevrimiçi olmayanlar
- Başka kullanıcıların cihazlarına video/yorum/beğeni senkronizasyonu
- Gerçek e-posta hesabı ve çok cihazlı profil
- İnternet üzerinden çok izleyicili canlı yayın
- Gerçek push bildirimleri ve özel mesajlar

Yerel veriler yalnızca bu telefonda/uygulama kurulumunda bulunur. Uygulama kaldırılırsa Android uygulama verileri de silinebilir. Demo akıştaki içerikler örnek kartlardır; gerçek kullanıcı gönderileri değildir. Canlı ekranı yalnızca kamera önizlemesi yapar, başka kişilere yayın göndermez.

## APK üretme (Android Studio olmadan)
1. Bu ZIP'in içeriğini GitHub deponun köküne yükle; mevcut dosyaların üzerine yaz.
2. `.github/workflows/android.yml` dosyasının depoda bulunduğunu doğrula.
3. GitHub > Actions > VYRO Android APK bölümüne gir.
4. En son çalışmanın yeşil tikle bitmesini bekle.
5. Artifacts bölümünden `VYRO-debug-APK` dosyasını indir.
6. ZIP'i telefonda aç ve `app-debug.apk` dosyasını kur.

Debug APK test içindir; mağaza yayını için ayrıca imzalı release APK gerekir.

## Notlar
- Video yüklemeleri cihazın IndexedDB depolamasında tutulur. Büyük videolar telefonun boş alanına bağlı olarak kaydedilemeyebilir.
- Kamera izni Android WebView/cihaz üreticisine göre değişebilir. İzin verilmezse Android uygulama ayarlarından kamera ve mikrofon izinlerini aç.
- Gerçek çok kullanıcılı sosyal ağ ve canlı yayın için güvenli sunucu, kimlik doğrulama, veritabanı kuralları, depolama ve yayın sunucusu yapılandırması ayrıca yapılmalıdır.
