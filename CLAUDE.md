# CLAUDE.md — SwaglineAI Proje Anayasası

Bu dosya projede çalışan her geliştirici (insan veya AI) için **bağlayıcı kurallardır**.
Her oturuma başlamadan önce sırasıyla bu dosyayı, `SPEC.md`, `ARCHITECTURE.md` ve `TODO.md` dosyalarını oku.
Kullanıcıdan uygulamayı yeniden anlatmasını isteme; bilgi bu dört dosyada.

## 1. Ürün özeti

SwaglineAI, React Native (Expo) ile yazılmış bir **sanal kabin (virtual try-on)** mobil uygulamasıdır.
Kullanıcı tam boy fotoğrafını çeker/seçer, ardından denemek istediği kıyafet/ürün fotoğrafını ekler ve
AI servisi tarafından üzerine giydirilmiş halini görür. Ayrıntılı akış: `SPEC.md`.

## 2. Stack

| Katman | Seçim |
|---|---|
| Çatı | Expo SDK 58 (managed, Continuous Native Generation) |
| Dil | TypeScript (strict) |
| Navigasyon | Expo Router (dosya tabanlı, `src/app/`) |
| Görsel seçme/çekme | `expo-image-picker` |
| Durum | React Context + `useReducer` (`src/store/`) — ek kütüphane yok |
| Stil | `StyleSheet` + `src/theme` tokenları |

- Expo hızla değişir: Expo/RN API'si yazmadan önce `package.json`'daki SDK sürümüne ait dokümana bak
  (`https://docs.expo.dev/versions/v58.0.0/`) veya `node_modules` içindeki tip tanımlarını kontrol et. Ezberden yazma.
- `ios/` ve `android/` klasörleri elle oluşturulmaz/düzenlenmez; native ayarlar `app.json` ve config plugin'lerle yapılır.
- Uygulama Expo Go ile çalışabilir durumda kalmalı. Expo Go'da olmayan native modül gerektiren bir paket
  eklenecekse önce kullanıcıya sor (development build gerekir).

## 3. Klasör yapısı

```
SwaglineAI/
├── CLAUDE.md, SPEC.md, ARCHITECTURE.md, TODO.md   # Hafıza katmanı — her adımda güncel tut
├── app.json                 # Expo yapılandırması (izin metinleri, plugin'ler)
├── assets/                  # İkon, splash vb.
└── src/
    ├── app/                 # SADECE route dosyaları (Expo Router). İnce tutulur, feature ekranını render eder.
    │   ├── _layout.tsx      # Kök Stack + provider'lar
    │   ├── index.tsx        # Karşılama
    │   ├── capture/body.tsx # Boy fotoğrafı
    │   ├── capture/garment.tsx
    │   ├── processing.tsx
    │   └── result.tsx
    ├── features/            # Özellik bazlı modüller
    │   └── <feature>/
    │       ├── screens/     # Ekran bileşeni (route bunu export eder)
    │       ├── components/  # Sadece bu özelliğe ait bileşenler
    │       ├── hooks/       # UI ile servis arasındaki akış mantığı
    │       └── index.ts     # Dışarıya açılan public API
    ├── components/ui/       # Özellikten bağımsız, tekrar kullanılabilir UI (Button, Screen...)
    ├── services/            # Dış dünya ile konuşan her şey (picker, görsel işleme, try-on API)
    ├── store/               # Uygulama/oturum durumu (Context)
    ├── theme/               # Renk, boşluk, tipografi tokenları
    ├── types/               # Paylaşılan domain tipleri
    └── config/              # Ortam yapılandırması (env.ts)
```

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

## 5. Güvenlik: API anahtarları istemciye GÖMÜLMEZ

- AI try-on sağlayıcısının (veya herhangi bir 3. partinin) **gizli anahtarı asla** uygulama koduna,
  `app.json`'a, `EXPO_PUBLIC_*` değişkenlerine veya repoya konmaz. Mobil paket herkes tarafından açılabilir.
- Mobil uygulama **sadece kendi backend proxy'mizle** konuşur. Anahtar backend'de durur; backend sağlayıcıya iletir.
- `EXPO_PUBLIC_*` değişkenlerinde yalnızca herkese açık değerler olur (ör. `EXPO_PUBLIC_API_BASE_URL`).
- `.env` dosyaları git'e eklenmez; örnek değerler `.env.example` içinde tutulur.
- Kullanıcı fotoğrafları hassas veridir: loglanmaz, gereksiz yere diske kopyalanmaz, analitiğe gönderilmez.

## 6. Servis katmanı ayrımı

- UI bileşenleri ve hook'lar `expo-image-picker`, `fetch`, AI SDK'sı gibi dış API'leri **doğrudan çağırmaz**;
  bunlar `src/services/` altındaki modüllerde sarmalanır.
- Try-on servisi bir **arayüz** (`TryOnService`) üzerinden kullanılır. `mock` ve `http` olmak üzere iki uygulaması olur;
  hangisinin kullanılacağı `src/config/env.ts` ile seçilir. Ayrıntılar: `ARCHITECTURE.md`.
- Mock servis, gerçek servisle aynı sözleşmeyi (gecikme, polling, hata senaryoları dahil) taklit eder.

## 7. Yeni paket ekleme kuralı

- Paketler **sadece** `npx expo install <paket>` ile eklenir (SDK uyumlu sürüm için).
- Her yeni paket için **gerekçe yazılır**: neden gerekli, Expo'nun kendi modülüyle neden çözülemiyor,
  Expo Go'da çalışıyor mu. Gerekçe hem kullanıcıya verilen özette hem de aşağıdaki tabloya eklenir.
- Mümkünse resmi Expo modülü tercih edilir; küçük işler için paket eklenmez.

| Paket | Gerekçe | Eklendiği adım |
|---|---|---|
| `expo-router` (+ `react-native-screens`, `react-native-safe-area-context`, `expo-linking`, `expo-constants`) | Expo'nun önerdiği dosya tabanlı navigasyon; diğerleri onun zorunlu eş bağımlılıkları. | Adım 1 |
| `expo-image-picker` | Kamera ile çekme ve galeriden seçme, izin yönetimi dahil. Resmi Expo modülü, Expo Go'da çalışır. | Adım 1 |

## 8. Çalışma akışı (her adımda)

1. `TODO.md`'den sıradaki adımı al; sadece onu uygula.
2. `npx tsc --noEmit` çalıştır (test altyapısı kurulduktan sonra `npm test` de).
3. `TODO.md`'de adımı `[x]` yap; akış/mimari değiştiyse `SPEC.md` / `ARCHITECTURE.md`'yi güncelle;
   yeni paket varsa yukarıdaki tabloya ekle.
4. Kullanıcıya kısa özet: değişen dosyalar, eklenen paketler (gerekçeli), nasıl test edileceği.
5. Repo oluşturma, push veya PR açma işlemlerinden önce kullanıcıya sor.

## 9. Komutlar

```bash
npm install            # bağımlılıklar
npx expo start         # geliştirme sunucusu (Expo Go ile QR okut)
npx tsc --noEmit       # tip kontrolü  (npm run typecheck)
npx expo install <p>   # paket ekleme
```
