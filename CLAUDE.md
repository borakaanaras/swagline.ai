# CLAUDE.md — SwaglineAI Proje Anayasası

Bu dosya projede çalışan her geliştirici (insan veya AI) için **bağlayıcı kurallardır**.
Her oturuma başlamadan önce sırasıyla bu dosyayı, `SPEC.md`, `ARCHITECTURE.md` ve `TODO.md` dosyalarını oku.
Kullanıcıdan uygulamayı yeniden anlatmasını isteme; bilgi bu dört dosyada.

## 1. Ürün özeti ve kararlar

SwaglineAI, React Native (Expo) ile yazılmış, **son kullanıcıya** yönelik bir **sanal kabin (virtual try-on)** mobil uygulamasıdır.
Kullanıcı tam boy fotoğrafını çeker/seçer, ardından bir veya birden fazla ürünün (kıyafet, ayakkabı, gözlük, aksesuar)
fotoğrafını ekler ve AI tarafından **aynı anda** üzerine giydirilmiş halini görür. Ayrıntılı akış: `SPEC.md`.

Ürün sahibinin onayladığı kararlar (değiştirmeden önce kullanıcıya sor):

| Konu | Karar |
|---|---|
| Hedef kitle | Son kullanıcılar (B2C) |
| Ürün türleri | Üst, alt, elbise, dış giyim, ayakkabı, gözlük, aksesuar |
| Giydirme | Birden fazla parça aynı anda (kombin) |
| Ürün görseli kaynağı | Şimdilik sadece galeri + kamera (link/katalog yok) |
| Ürün arka planı | Otomatik temizlenir |
| AI servisi | Replicate **IDM-VTON**; şimdilik **mock** yanıt |
| Backend | **Firebase** (Cloud Functions + Auth + Firestore) |
| Giriş | **Apple** ve **Google** ile giriş |
| Veri saklama | Boy fotoğrafı, sonuçlar, geçmiş ve favoriler **sadece cihazda**. Sunucuda görsel saklanmaz. |
| Geçmiş / favoriler | Var (cihazda) |
| İş modeli | İlk 1 deneme ücretsiz, sonrası ücretli. **Geliştirmede ödeme kapalı** (bayrakla). |
| Dil | Sadece Türkçe (metinler yine de tek yerde toplanır, ileride i18n kolay olsun) |
| Platform önceliği | **iOS** (Android desteklenir ama önce iOS'ta test edilir) |

## 2. Stack

| Katman | Seçim | Durum |
|---|---|---|
| Çatı | Expo SDK 58 (managed, Continuous Native Generation) | ✅ |
| Dil | TypeScript (strict) | ✅ |
| Navigasyon | Expo Router (dosya tabanlı, `src/app/`) | ✅ |
| Görsel seçme/çekme | `expo-image-picker` | ✅ |
| Durum | React Context + `useReducer` (`src/store/`) | ✅ |
| Stil | `StyleSheet` + `src/theme` tokenları | ✅ |
| Görsel işleme | `expo-image-manipulator` | ⏳ |
| Cihazda kalıcı veri | `expo-file-system` (görseller) + `expo-sqlite` veya AsyncStorage (kayıtlar) — Adım 11'de karar | ⏳ |
| Backend | Firebase Cloud Functions (Node/TS), Firestore (sadece kullanıcı hakları), Firebase Auth | ⏳ |
| Giriş | `expo-apple-authentication`, Google Sign-In | ⏳ |
| Ödeme | App Store / Play uygulama içi satın alma (kütüphane Adım 17'de seçilecek) | ⏳ |

### Tasarım paleti (theme: `src/theme/index.ts`)

| Token | Renk | Kullanım |
|---|---|---|
| `background` | `#0F0F12` | Arka plan (derin siyah/kömür) |
| `surface` | `#1C1C24` | Kartlar / yüzeyler |
| `primary` | `#6366F1` | CTA / birincil aksiyon (Electric Indigo) |
| `accent` | `#22D3EE` | AI etkileşimi vurgusu (Cyber Cyan): işleniyor animasyonu, AI rozetleri |
| `text` | `#F8FAFC` | Birincil metin |
| `textMuted` | `#94A3B8` | İkincil metin |

Uygulama yalnızca koyu temadır (`userInterfaceStyle: dark`).

### Expo notları

- Expo hızla değişir: Expo/RN API'si yazmadan önce SDK 58 dokümanına (`https://docs.expo.dev/versions/v58.0.0/`)
  veya `node_modules` içindeki tip tanımlarına bak. Ezberden yazma.
- `ios/` ve `android/` klasörleri elle oluşturulmaz/düzenlenmez; native ayarlar `app.json` ve config plugin'lerle yapılır.
- **Expo Go dönemi sınırlı:** Google Sign-In ve uygulama içi satın alma native modül gerektirir, Expo Go'da çalışmaz.
  Bu adımlara gelince **EAS development build** (iOS öncelikli) gerekir. O ana kadar her şey Expo Go'da çalışır kalmalı.
  Expo Go'da olmayan native modül gerektiren bir paket eklemeden önce kullanıcıya sor.

## 3. Klasör yapısı

```
SwaglineAI/
├── CLAUDE.md, SPEC.md, ARCHITECTURE.md, TODO.md   # Hafıza katmanı — her adımda güncel tut
├── app.json                 # Expo yapılandırması (izin metinleri, plugin'ler)
├── assets/                  # İkon, splash vb.
├── backend/                 # ⏳ Firebase projesi (Cloud Functions). Mobil koddan bağımsız.
└── src/
    ├── app/                 # SADECE route dosyaları (Expo Router). İnce tutulur, feature ekranını render eder.
    ├── features/            # Özellik bazlı modüller
    │   └── <feature>/
    │       ├── screens/     # Ekran bileşeni (route bunu export eder)
    │       ├── components/  # Sadece bu özelliğe ait bileşenler
    │       ├── hooks/       # UI ile servis arasındaki akış mantığı
    │       └── index.ts     # Dışarıya açılan public API
    ├── components/ui/       # Özellikten bağımsız, tekrar kullanılabilir UI (Button, Screen...)
    ├── services/            # Dış dünya ile konuşan her şey (picker, görsel işleme, try-on, auth, depolama)
    ├── store/               # Uygulama/oturum durumu (Context)
    ├── theme/               # Renk, boşluk, tipografi tokenları
    ├── types/               # Paylaşılan domain tipleri
    └── config/              # Ortam yapılandırması (env.ts)
```

Planlanan feature'lar: `body-photo` ✅, `outfit` (ürün seçme/kombin), `try-on` (işleniyor), `result`, `history`, `auth`, `paywall`.

## 4. Kodlama kuralları

1. **TypeScript strict.** `any` yok; gerekiyorsa `unknown` + daraltma. `npx tsc --noEmit` her adımda temiz geçmeli.
2. **Route dosyaları incedir.** `src/app/*` içinde iş mantığı olmaz; ilgili `features/*/screens` bileşenini export eder.
3. **Katman yönü tek yönlüdür:** `app → features → (components/ui, store, services, types)`.
   `services` UI'ı, `components/ui` feature'ları import etmez. Bir feature başka bir feature'ın iç dosyalarına
   değil, sadece `index.ts` public API'sine erişir.
4. **İsimlendirme:** Bileşen/ekran dosyaları `PascalCase.tsx`, hook'lar `useX.ts`, servisler `camelCaseService.ts`.
   Kod, değişken ve dosya adları **İngilizce**; kullanıcıya görünen metinler **Türkçe**.
5. **Import alias:** `src` altı için `@/` kullan (`@/services/...`). Aynı feature içinde göreli import serbest.
6. **Sonuç tipleri:** Servisler beklenen hataları `throw` etmek yerine ayrık birleşim (discriminated union)
   döndürür: `{ status: 'success' | 'cancelled' | 'permission-denied' | 'error', ... }`.
7. **Stil:** Sabit renk/ölçü yazma; `@/theme` tokenlarını kullan. Inline stil yerine `StyleSheet.create`.
8. **Erişilebilirlik:** Dokunulabilir öğelerde `accessibilityRole`, görsellerde `accessibilityLabel`.
9. **Küçük adımlar:** Her değişiklik `TODO.md`'deki tek bir adıma karşılık gelir. Kapsam dışı işi yapma; not al.
10. **iOS önce:** Her UI adımı önce iOS'ta (Expo Go / simülatör) doğrulanır; güvenli alan ve izin metinleri iOS'a göre yazılır.

## 5. Güvenlik ve gizlilik

- **API anahtarları istemciye GÖMÜLMEZ.** Replicate token'ı (veya herhangi bir gizli anahtar) asla uygulama koduna,
  `app.json`'a, `EXPO_PUBLIC_*` değişkenlerine veya repoya konmaz. Mobil paket herkes tarafından açılabilir.
- Mobil uygulama **sadece kendi Firebase Cloud Functions'ımızla** konuşur. Replicate token'ı Functions'ta
  **Secret Manager** (`defineSecret`) ile durur.
- Firebase istemci yapılandırması (apiKey, projectId vb.) gizli değildir, istemcide durabilir; güvenlik
  Auth + App Check + Firestore kuralları ile sağlanır.
- `EXPO_PUBLIC_*` değişkenlerinde yalnızca herkese açık değerler olur. `.env` git'e eklenmez; örnekler `.env.example`'da.
- **Görseller sunucuda saklanmaz.** Functions görselleri yalnızca işlem süresince bellekte/geçici olarak tutar,
  sonuç döndükten sonra siler. Firestore'da görsel veya görsel URL'si tutulmaz; sadece kullanıcı hakları (deneme sayısı, abonelik).
- Kullanıcı fotoğrafları loglanmaz, analitiğe gönderilmez.
- **Ücretsiz deneme ve ödeme hakkı backend'de doğrulanır**; istemci bayrağı sadece UI'ı açar/kapatır.

## 6. Servis katmanı ayrımı

- UI bileşenleri ve hook'lar `expo-image-picker`, `fetch`, Firebase SDK'sı gibi dış API'leri **doğrudan çağırmaz**;
  bunlar `src/services/` altındaki modüllerde sarmalanır.
- Try-on servisi bir **arayüz** (`TryOnService`) üzerinden kullanılır. `mock` ve `firebase` olmak üzere iki uygulaması olur;
  hangisinin kullanılacağı `src/config/env.ts` ile seçilir. Ayrıntılar: `ARCHITECTURE.md`.
- Mock servis, gerçek servisle aynı sözleşmeyi (gecikme, polling, hata senaryoları, çoklu parça, arka plan temizleme dahil) taklit eder.
- Auth, cihazda depolama (geçmiş/favoriler) ve hak/ödeme de aynı şekilde arayüz + uygulama olarak yazılır.

## 7. Yeni paket ekleme kuralı

- Mobil paketler **sadece** `npx expo install <paket>` ile eklenir (SDK uyumlu sürüm için).
- Her yeni paket için **gerekçe yazılır**: neden gerekli, Expo'nun kendi modülüyle neden çözülemiyor,
  Expo Go'da çalışıyor mu. Gerekçe hem kullanıcıya verilen özette hem de aşağıdaki tabloya eklenir.
- Mümkünse resmi Expo modülü tercih edilir; küçük işler için paket eklenmez.

| Paket | Gerekçe | Expo Go | Eklendiği adım |
|---|---|---|---|
| `expo-router` (+ `react-native-screens`, `react-native-safe-area-context`, `expo-linking`, `expo-constants`) | Expo'nun önerdiği dosya tabanlı navigasyon; diğerleri onun zorunlu eş bağımlılıkları. | ✅ | Adım 1 |
| `expo-image-picker` | Kamera ile çekme ve galeriden seçme, izin yönetimi dahil. Resmi Expo modülü. | ✅ | Adım 1 |

## 8. Çalışma akışı (her adımda)

1. `TODO.md`'den sıradaki adımı al; sadece onu uygula.
2. `npx tsc --noEmit` çalıştır (test altyapısı kurulduktan sonra `npm test` ve `npm run lint` de).
3. `TODO.md`'de adımı `[x]` yap; akış/mimari değiştiyse `SPEC.md` / `ARCHITECTURE.md`'yi güncelle;
   yeni paket varsa yukarıdaki tabloya ekle; yeni ürün kararı varsa §1 tablosuna ekle.
4. Kullanıcıya kısa özet: değişen dosyalar, eklenen paketler (gerekçeli), nasıl test edileceği.
5. Repo oluşturma, push, PR açma, Firebase projesi oluşturma veya canlıya deploy etmeden önce kullanıcıya sor.

## 9. Komutlar

```bash
npm install            # bağımlılıklar
npx expo start         # geliştirme sunucusu (iPhone'da Expo Go ile QR okut)
npx tsc --noEmit       # tip kontrolü  (npm run typecheck)
npx expo install <p>   # paket ekleme
```
