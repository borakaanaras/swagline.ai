# 🪞 SwaglineAI

**Almadan önce üzerinde gör.**

SwaglineAI, cebindeki sanal deneme kabini. Kendi fotoğrafını ekliyorsun, denemek istediğin ürünlerin fotoğraflarını seçiyorsun, yapay zekâ hepsini aynı anda üzerine giydiriyor. Mağazaya gitmeden, kargo beklemeden, iade derdi olmadan bir kombinin sende nasıl durduğunu görüyorsun.

> Durum: Erken geliştirme aşamasında. iOS öncelikli, React Native (Expo) ile yazılıyor.

---

## ✨ Nasıl çalışır?

1. **Fotoğrafını ekle.** Kamerayla çek ya da galeriden seç. Tam boy olması gerekmiyor: ne deneyeceksen o bölgenin görünmesi yeterli.
2. **Kombinini oluştur.** Ürünlerin fotoğraflarını ekle, her birinin kategorisini seç, denemek istediklerine dokun.
3. **Üzerinde dene.** AI seçtiğin parçaları sırayla giydirir; ilerlemeyi ekranda adım adım izlersin.
4. **Sonucu kaydet.** *Önce / Sonra* ile karşılaştır, logolu hâlini tek dokunuşla Fotoğraflar'a indir.

## 👗 Ne deneyebilirsin?

| Kategori | Örnek | Fotoğrafın nasıl olmalı? |
|---|---|---|
| Üst, dış giyim | Tişört, gömlek, ceket, mont | Belden yukarısı yeter |
| Alt, elbise | Pantolon, etek, elbise, tulum | Boydan |
| Ayakkabı | Spor ayakkabı, bot | Boydan, ayaklar görünsün |
| Gözlük, aksesuar | Güneş gözlüğü, şapka, çanta, takı | Yüzün / ilgili bölge net |

Birden fazla parçayı aynı anda deneyebilirsin. Kombin kuralları otomatik uygulanır: her kategoriden bir ürün seçilir, elbise seçilince üst ve alt kombinden çıkar.

## 🌟 Öne çıkanlar

- **Kombin hâlinde deneme:** Üst, alt, ayakkabı ve aksesuarı tek seferde giydir.
- **Akıllı çekim rehberi:** Ne deneyeceğine göre nasıl fotoğraf çekmen gerektiğini gösterir.
- **Otomatik arka plan temizleme:** Ürün fotoğrafının arka planı sen uğraşmadan ayıklanır (istersen kapatabilirsin).
- **Önce / Sonra:** Sonucu orijinal fotoğrafınla yan yana karşılaştır, yakınlaştırarak incele.
- **Tek dokunuşla indir:** Sonuç, köşesinde hafif SwaglineAI logosuyla galerine kaydedilir.
- **Gizlilik öncelikli:** Fotoğrafların, sonuçların, geçmişin ve favorilerin yalnızca senin cihazında durur.

## 🔒 Gizlilik

- Fotoğrafların sunucuda **saklanmaz**. Yalnızca giydirme işlemi süresince işlenir, iş bitince silinir.
- Geçmiş ve favoriler sadece cihazında tutulur; uygulamayı silersen onlar da silinir.
- Fotoğrafların loglanmaz, analitik amaçlı kullanılmaz.
- AI servis anahtarları uygulamanın içinde yer almaz; uygulama yalnızca kendi sunucumuzla konuşur.

## 🎨 Tasarım

Uygulamanın görsel dili bir butik deneme kabininden geliyor: fotoğrafın her ekranda **kemerli bir kabin aynasının** içinde durur. Koyu, sakin bir arayüzde iki vurgu rengi var: **indigo** senin aksiyonların için, **cyan** ise AI çalışırken — fotoğrafının üzerinden geçen tarama ışığı gibi. Yazı karakteri Bricolage Grotesque.

## 🛠️ Teknoloji

| Katman | Kullanılan |
|---|---|
| Mobil | React Native, Expo SDK 58, TypeScript (strict), Expo Router |
| Görsel | expo-image-picker, expo-image-manipulator, react-native-view-shot, expo-media-library |
| AI | Replicate üzerinde sanal deneme (virtual try-on) modeli |
| Backend (planlanan) | Firebase: Cloud Functions, Auth, Firestore |
| Giriş (planlanan) | Apple ve Google ile giriş |

## 💻 Geliştirme

### 📋 Gereksinimler

- Node.js 20.6 veya üzeri
- iPhone'da **Expo Go** uygulaması (veya iOS simülatörü)

### 🚀 Kurulum ve çalıştırma

```bash
npm install
cp .env.example .env
npx expo start
```

Terminalde çıkan QR kodu iPhone kamerasıyla okut, uygulama Expo Go'da açılır.

### 🧪 AI olmadan (demo modu)

`.env` dosyasında `EXPO_PUBLIC_TRYON_BACKEND=mock` iken uygulama sahte bir AI servisiyle uçtan uca çalışır. Sonuç olarak kendi fotoğrafın gösterilir; akışı ve arayüzü test etmek içindir.

### 🤖 Gerçek AI ile (geçici yerel sunucu)

1. [Replicate](https://replicate.com/account/api-tokens) hesabından bir API token'ı al.
2. `dev-server/.env.example` dosyasını `dev-server/.env` olarak kopyala ve token'ı ekle.
3. Ana `.env` dosyasında `EXPO_PUBLIC_TRYON_BACKEND=dev-server` yap, `EXPO_PUBLIC_DEV_SERVER_URL` değerine Mac'inin yerel IP adresini yaz.
4. Sunucuyu ve uygulamayı başlat:

```bash
npm run dev-server
```

```bash
npx expo start -c
```

Telefon ve bilgisayar aynı Wi-Fi ağında olmalı. Replicate kullandıkça ücretlendirir.

### ⌨️ Faydalı komutlar

| Komut | Ne yapar? |
|---|---|
| `npx expo start` | Geliştirme sunucusunu başlatır |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run dev-server` | Gerçek AI için geçici yerel sunucu |

## 📁 Proje yapısı

```
src/
├── app/          Ekran rotaları (Expo Router)
├── features/     Özellikler: body-photo, outfit, try-on, result
├── components/   Ortak arayüz bileşenleri (Mirror, Button, ScanLine…)
├── services/     Dış dünya: kamera/galeri, görsel işleme, AI servisi
├── store/        Oturum durumu ve kombin kuralları
├── theme/        Renk, font ve boşluk tokenları
└── types/        Paylaşılan tipler
dev-server/       Geçici AI köprüsü (Firebase gelince kaldırılacak)
```

Ayrıntılı dokümanlar:

- [SPEC.md](SPEC.md): Ürün akışı, ekranlar ve hata durumları
- [ARCHITECTURE.md](ARCHITECTURE.md): Teknik mimari, AI servis sözleşmesi
- [TODO.md](TODO.md): Yol haritası ve adımlar

## 🗺️ Yol haritası

- [x] Fotoğraf çekme/seçme ve çekim rehberi
- [x] Kombin oluşturma (çoklu parça)
- [x] İşleniyor ve sonuç ekranları, logolu indirme
- [x] Gerçek AI bağlantısı (geçici yerel sunucu)
- [ ] Geçmiş ve favoriler (cihazda)
- [ ] Paylaşma
- [ ] Firebase backend ve kalıcı AI altyapısı
- [ ] Apple ve Google ile giriş
- [ ] İlk deneme ücretsiz, sonrası ücretli model
- [ ] App Store yayını

## 👤 Geliştirici

**Bora Kaan Aras**

## 📄 Lisans

Henüz belirlenmedi.
