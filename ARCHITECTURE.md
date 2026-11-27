# ARCHITECTURE.md — Teknik Mimari

> Bu dosya "nasıl" sorusunu cevaplar. Ürün davranışı için `SPEC.md`, kurallar ve kararlar için `CLAUDE.md`.

## 1. Genel resim

```
┌──────────────────────── Mobil uygulama (Expo) ────────────────────────┐
│ src/app (routes)          ince; sadece ekranı bağlar                   │
│ src/features/*            ekran + hook (akış mantığı)                  │
│ src/store                 oturum durumu (Context + reducer)            │
│ src/services              picker · imageProcessor · tryOn (mock|fb)    │
│                           auth · localStore (geçmiş/favori) · billing  │
│ Cihaz diski               boy fotoğrafı, sonuçlar, geçmiş, favoriler   │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ HTTPS (Firebase Auth ID token)
┌───────────────────────────────▼──────── Firebase (backend/) ───────────┐
│ Cloud Functions (TS)   startTryOn · getTryOnStatus · cancelTryOn       │
│                        replicateWebhook · (billing webhook)            │
│ Cloud Storage          tmp/{uid}/{jobId}/*  — geçici, iş bitince silinir│
│ Firestore              users/{uid} (haklar) · jobs/{jobId} (durum, TTL)│
│ Secret Manager         REPLICATE_API_TOKEN                             │
└───────────────────────────────┬────────────────────────────────────────┘
                                ▼
                    Replicate: arka plan temizleme modeli + IDM-VTON
```

- **Bağımlılık yönü yukarıdan aşağıya.** Servisler React'i bilmez (saf TS), bu yüzden birim testi kolaydır.
- Domain tipleri `src/types/` altındadır. Servisler 3. parti tipleri bu tiplere dönüştürür.
- Geliştirme boyunca `tryOn` servisi **mock**'tur; Firebase yokken de uçtan uca akış çalışır.

### Mevcut dosyalar (Adım 1)

| Dosya | Sorumluluk |
|---|---|
| `src/services/media/imagePickerService.ts` | İzin kontrol/isteme, kamera/galeri açma, sonucu `PickImageResult`'a çevirme |
| `src/store/TryOnSessionContext.tsx` | `bodyPhoto` durumu (`setBodyPhoto`, `clearBodyPhoto`, `reset`) |
| `src/features/body-photo/hooks/useBodyPhotoPicker.ts` | Servis sonucunu oturuma yazar, `loadingSource` / `error` üretir |
| `src/features/body-photo/screens/BodyPhotoScreen.tsx` | Ekran düzeni |
| `src/config/env.ts` | Herkese açık ortam değerleri: mock seçimi, paywall bayrağı |
| `src/theme/index.ts` | Marka paleti ve tokenlar |

## 2. Domain modeli (hedef)

```ts
type GarmentSlot = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'eyewear' | 'accessory';

type Garment = {
  id: string;                       // istemcide üretilen uuid
  image: LocalImage;                // kullanıcının seçtiği orijinal
  slot: GarmentSlot;
  removeBackground: boolean;        // varsayılan true; kullanıcı "Orijinali kullan" derse false
};

type Outfit = Partial<Record<GarmentSlot, string>>;   // yuva → garment id

type TryOnSessionState = {
  bodyPhoto: LocalImage | null;     // ✅ Adım 1
  garments: Garment[];              // ⏳ Adım 5 (en fazla 10)
  outfit: Outfit;                   // ⏳ Adım 5
  activeJob: { jobId: string } | null;            // ⏳ Adım 8
};
```

**Kombin kuralları** (saf fonksiyon `applyGarmentToOutfit(outfit, garment)`, birim testli):
- Her yuvada en fazla 1 ürün; aynı yuvaya yeni ürün eskisinin yerine geçer.
- `dress` seçilince `top` ve `bottom` çıkarılır; `top` veya `bottom` seçilince `dress` çıkarılır.

**Giydirme sırası** (backend ve mock aynı sırayı kullanır):
`bottom` → `dress` → `top` → `outerwear` → `shoes` → `eyewear` → `accessory`.
(Bir kombinde `dress` ile `top`/`bottom` birlikte olamayacağı için çakışma yok.)

## 3. Görsel hazırlama: sıkıştırma ve boyutlandırma (yüklemeden önce, cihazda)

Amaç: yükleme süresini ve maliyeti düşürmek, servisin beklediği boyutta kalmak, EXIF/konum verisini atmak.

- Modül: `src/services/image/imageProcessor.ts` (⏳ Adım 4), paket: `expo-image-manipulator`.
- Kurallar:
  | Görsel | Uzun kenar (max) | Format | Kalite | Hedef boyut |
  |---|---|---|---|---|
  | Boy fotoğrafı | 1536 px | JPEG | 0.85 | ≤ 1.5 MB |
  | Ürün fotoğrafı | 1024 px | JPEG | 0.85 | ≤ 1 MB |
- Adımlar: EXIF yönelimini uygula ve meta veriyi at → uzun kenar sınırı aşıyorsa oranı koruyarak küçült (büyütme yok)
  → JPEG kaydet → hedef boyut aşılırsa kaliteyi 0.85 → 0.7 → 0.55 düşürerek en fazla 2 kez daha dene.
- Çıktı: `PreparedImage { uri, width, height, sizeBytes, mimeType: 'image/jpeg' }`.
- Saf, birim testli fonksiyonlar: `computeResizeDimensions({ width, height }, maxLongEdge)`,
  `validateBodyPhoto(image) → ('landscape' | 'low-resolution')[]` (⏳ Adım 3).

## 4. Otomatik arka plan temizleme

- **Nerede:** Backend pipeline'ının ilk adımı (Replicate üzerinde bir arka plan kaldırma modeli; model seçimi Adım 15'te).
  Cihazda yapılmaz: Expo Go'da hazır bir yerel çözüm yok; ileride iOS'ta native "subject lifting" ile cihaz içi
  önizleme değerlendirilebilir (development build gerektirir, ertelendi).
- Sadece `removeBackground: true` olan ürünlere uygulanır. Boy fotoğrafına uygulanmaz.
- Temizleme başarısız olursa o ürün orijinal görselle devam eder ve sonuçta uyarı (`warnings: ['BG_REMOVAL_FAILED:<garmentId>']`) döner.
- Mock servis bu adımı gecikme ile simüle eder (görseli değiştirmez).

## 5. AI try-on servis sözleşmesi

### 5.1 İstemci arayüzü (`src/services/tryOn/types.ts`, ⏳ Adım 6)

```ts
export interface TryOnService {
  /** İşi başlatır; görseller önceden hazırlanmış (sıkıştırılmış) olmalı. */
  submit(request: TryOnRequest, signal?: AbortSignal): Promise<TryOnSubmitResponse>;
  getStatus(jobId: string, signal?: AbortSignal): Promise<TryOnJobStatus>;
  cancel(jobId: string): Promise<void>;
}

export type TryOnRequest = {
  bodyImage: PreparedImage;
  garments: { id: string; slot: GarmentSlot; image: PreparedImage; removeBackground: boolean }[]; // 1..7
  clientRequestId: string;          // idempotency anahtarı (uuid)
};

export type TryOnSubmitResponse = { jobId: string; estimatedSeconds?: number };

export type TryOnPhase = 'queued' | 'removing-background' | 'dressing';

export type TryOnJobStatus =
  | { state: 'queued' }
  | { state: 'processing'; phase: TryOnPhase; currentSlot?: GarmentSlot; step: number; totalSteps: number; progress?: number }
  | { state: 'succeeded'; result: TryOnResult }
  | { state: 'failed'; error: TryOnError }
  | { state: 'cancelled' };

export type TryOnResult = {
  imageUrl: string;                 // geçici URL (≈1 saat); istemci hemen cihaza indirir
  width: number;
  height: number;
  appliedGarmentIds: string[];      // başarıyla giydirilenler
  failedGarmentIds: string[];       // kısmi sonuç durumunda
  warnings: string[];
};

export type TryOnErrorCode =
  | 'NETWORK' | 'TIMEOUT' | 'RATE_LIMITED' | 'SERVER'
  | 'INVALID_BODY_IMAGE' | 'INVALID_GARMENT_IMAGE' | 'UNSUPPORTED_SLOT'
  | 'NO_CREDITS' | 'UNAUTHENTICATED' | 'CANCELLED' | 'UNKNOWN';

export type TryOnError = { code: TryOnErrorCode; message?: string; retryable: boolean; garmentId?: string };
```

`src/services/tryOn/index.ts` → `env.useMockServices` ise `mockTryOnService`, değilse `firebaseTryOnService`.
UI sadece `index.ts`'i import eder.

### 5.2 Replicate IDM-VTON entegrasyonu (backend'de)

- IDM-VTON tek seferde **tek bir giysi** giydirir ve kategori olarak yalnızca **üst (`upper_body`), alt (`lower_body`),
  elbise (`dresses`)** destekler. Bu yüzden:
  - **Çoklu parça = zincirleme:** Her parçanın çıktısı bir sonraki parçanın "insan görseli" girdisi olur
    (§2'deki sıra). Her ek adım süreyi ve maliyeti artırır, kaliteyi bir miktar düşürebilir; kombin başına
    en fazla 7 adım.
  - Yuva eşlemesi: `top` → `upper_body`, `bottom` → `lower_body`, `dress` → `dresses`,
    `outerwear` → `upper_body` (üstün üzerine ikinci geçiş; kalitesi test edilecek).
  - **`shoes`, `eyewear`, `accessory` IDM-VTON'da desteklenmiyor.** Bunlar için ayrı bir model/yöntem gerekecek
    (açık karar, Adım 15). O zamana kadar backend bu yuvalar için `UNSUPPORTED_SLOT` döndürür ve kısmi sonuç verir;
    **mock ise tüm yuvaları destekliyormuş gibi davranır** ki UI eksiksiz geliştirilebilsin.
- Girdi alanları (model sürümüne göre entegrasyonda doğrulanacak): insan görseli, giysi görseli, giysi açıklaması
  (yuvadan türetilen kısa İngilizce metin, ör. "a shirt"), kategori, kırpma ve tohum (seed) ayarları.
- Model sürümü (version hash) backend yapılandırmasında sabitlenir; güncellemeler bilinçli yapılır.

### 5.3 Firebase Cloud Functions sözleşmesi (⏳ Adım 15)

Mobil → Functions çağrıları Firebase Auth ID token'ı ile yapılır (callable functions).

| Fonksiyon | Girdi | Çıktı |
|---|---|---|
| `startTryOn` (callable) | `{ clientRequestId, garments: [{ id, slot, removeBackground }] }` — görseller önceden Storage'a yüklenmiş: `tmp/{uid}/{clientRequestId}/body.jpg`, `.../garment-{id}.jpg` | `{ jobId, estimatedSeconds }` |
| `getTryOnStatus` (callable) | `{ jobId }` | `TryOnJobStatus` (§5.1, `snake_case` değil) |
| `cancelTryOn` (callable) | `{ jobId }` | `{}` |
| `replicateWebhook` (HTTPS) | Replicate tahmin tamamlanma bildirimi (imza doğrulamalı) | Zinciri bir sonraki adıma ilerletir, `jobs/{jobId}`'yi günceller |

- **Akış:** istemci görselleri Storage `tmp/` yoluna yükler → `startTryOn` hak kontrolü yapar, hakkı **rezerve eder**,
  `jobs/{jobId}` oluşturur, ilk Replicate tahminini webhook ile başlatır → her webhook bir sonraki adımı başlatır →
  son adımda `state: succeeded`, hak **kesinleşir**; hata/iptalde rezerv **iade** edilir.
- Webhook sayesinde uygulama arka plandayken de zincir ilerler; istemci sadece durumu sorgular.
- **Temizlik:** iş bitince `tmp/{uid}/{jobId}/` silinir; ayrıca Storage yaşam döngüsü kuralı 24 saatte siler.
  `jobs` belgeleri Firestore TTL ile 24 saatte silinir. Sonuç görseli sunucuda saklanmaz (yalnızca Replicate'in geçici URL'si döner).
- Güvenlik: Storage kuralı her kullanıcının yalnızca kendi `tmp/{uid}/` yoluna yazmasına izin verir (boyut ≤ 2 MB, `image/jpeg`).
  Firestore istemciye kapalıdır (yalnızca Functions yazar/okur). İleride App Check (development build gerektirir).
- Oran sınırı: kullanıcı başına dakikada 3, günde 50 `startTryOn` (aşımda `RATE_LIMITED`).

## 6. Bekleme, polling ve timeout mantığı

Yürütücü: `src/services/tryOn/runTryOnJob.ts` (⏳ Adım 6), saf TS, React'ten bağımsız, sahte zamanlayıcı ile test edilir.

```
prepare images ─► upload ─► submit ─► poll loop ─► succeeded | failed | cancelled | timeout
```

- **Submit:** 15 sn istek zaman aşımı; ağ/5xx hatasında üstel geri çekilme ile en fazla 2 tekrar (1 sn, 2 sn).
  Aynı `clientRequestId` kullanıldığı için tekrar güvenlidir.
- **Polling aralığı:** ilk sorgu 2 sn sonra; ardından `min(önceki × 1.5, 5 sn)` (2 → 3 → 4.5 → 5 → 5 …).
- **Tek sorgu zaman aşımı:** 10 sn. Geçici hata polling'i bitirmez; art arda 3 geçici hata → `NETWORK`/`SERVER`.
- **Genel zaman aşımı:** `60 sn + 45 sn × parça sayısı` (1 parça 105 sn, 3 parça 195 sn); aşılırsa `TIMEOUT` ve best-effort `cancel`.
- **İptal:** `AbortController`; bekleyen istek kesilir, `cancel(jobId)` çağrılır, sonuç `CANCELLED`.
- **İlerleme olayları:** `onProgress({ phase: 'preparing' | 'uploading' | 'queued' | 'removing-background' | 'dressing', currentSlot?, step?, totalSteps? })`.
- **Arka plan:** `AppState` `background` iken polling duraklar, `active` olunca hemen sorgu yapılıp devam eder; zaman aşımı duvar saatiyle ölçülür.
- Başarıda sonuç görseli hemen cihaza indirilir (`localStore`), geçici URL'ye bir daha güvenilmez.

## 7. Mock (sahte) servis katmanı

Gerçek backend hazır olana kadar tüm akış `mockTryOnService` ile çalışır (`EXPO_PUBLIC_USE_MOCK` varsayılan `true`).

- `TryOnService` arayüzünü birebir uygular; UI hangi servisin çalıştığını bilmez.
- Davranış: `submit` 300–600 ms gecikme → `queued` (1 sn) → `removing-background` (her ürün ~1 sn) →
  `dressing` her parça için ~3 sn (`step/totalSteps` ilerler) → `succeeded`.
- Sonuç görseli: şimdilik **boy fotoğrafının kendisi** (ileride ürün küçük resimlerini üstüne bindiren basit kompozisyon).
  Amaç akışı test etmek, kaliteyi değil. Upload adımı mock'ta atlanır (yerel URI'ler kullanılır).
- Tüm yuvaları destekler (gerçek backend'in aksine, bkz. §5.2).
- **Senaryolar:** `mockTryOnService.configure({ scenario })`
  `'success' | 'slow' | 'timeout' | 'invalid-body' | 'invalid-garment' | 'partial' | 'network-flaky' | 'rate-limited' | 'no-credits'`.
- Mock yalnızca `__DEV__` veya `EXPO_PUBLIC_USE_MOCK=true` iken seçilebilir; üretim derlemesinde `firebase` zorunludur.

## 8. Hak (deneme) ve ödeme

- `users/{uid}`: `{ freeTriesUsed: number, credits: number, entitlement?: 'pro', updatedAt }` — **yalnızca Functions yazar**.
- Kural: `freeTriesUsed < 1` ise ücretsiz; değilse `credits > 0` veya aktif `entitlement` gerekir; yoksa `NO_CREDITS`.
- Geliştirme bayrakları: backend `PAYWALL_ENABLED=false` (Functions ortam değişkeni) → hak kontrolü atlanır;
  istemci `EXPO_PUBLIC_PAYWALL_ENABLED=false` → paywall ekranı ve kalan hak göstergesi gizlenir.
- İstemci servis: `src/services/billing/` — `getEntitlement()`, `purchase(productId)`, `restore()`.
  Satın alma kütüphanesi (ör. RevenueCat veya StoreKit tabanlı bir Expo modülü) Adım 17'de gerekçeli seçilecek;
  her iki durumda da satın alma sunucu tarafında doğrulanıp `users/{uid}`'ye yazılır. Development build gerektirir.

## 9. Kimlik doğrulama

- Firebase Auth; sağlayıcılar **Apple** (`expo-apple-authentication` → Firebase `OAuthProvider('apple.com')` credential)
  ve **Google** (native Google Sign-In → Firebase `GoogleAuthProvider` credential).
- İstemci SDK tercihi: başlangıçta Firebase **JS SDK** (Expo Go uyumlu); App Check veya performans gerekirse
  `@react-native-firebase`'e geçiş değerlendirilir. Karar Adım 16'da, gerekçesiyle.
- `src/services/auth/authService.ts`: `signInWithApple()`, `signInWithGoogle()`, `signOut()`, `deleteAccount()`, `onAuthChanged()`.
- Oturum kalıcılığı: Firebase Auth kalıcılığı cihaz depolamasıyla.

## 10. Cihazda depolama: geçmiş ve favoriler

- `src/services/storage/localStore.ts` (⏳ Adım 11):
  - Görseller: `expo-file-system` ile uygulama belge dizini `swagline/{body|garments|results}/`.
  - Kayıtlar: `HistoryEntry { id, createdAt, resultPath, bodyPhotoPath, garments: { slot, thumbPath }[], favorite }`
    (`expo-sqlite` veya AsyncStorage; karar Adım 11'de gerekçeli).
- Saklama politikası: son 100 kayıt, favoriler hariç; eskiler ve sahipsiz dosyalar otomatik temizlenir.
- Boy fotoğrafı ve ürün havuzu da burada saklanır ki uygulama yeniden açıldığında kaybolmasın.
- Hiçbir şey sunucuya senkronize edilmez.

## 11. Ortam değişkenleri

| Değişken | Örnek | Not |
|---|---|---|
| `EXPO_PUBLIC_USE_MOCK` | `true` | `false` olunca Firebase servisi kullanılır |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | `false` | Geliştirmede kapalı |
| `EXPO_PUBLIC_FIREBASE_*` | (Adım 14) | Firebase istemci yapılandırması — gizli değildir |
| `EXPO_PUBLIC_API_BASE_URL` | — | Firebase'e geçince kaldırılacak |

Backend (Functions): `REPLICATE_API_TOKEN` (Secret Manager), `REPLICATE_WEBHOOK_SECRET` (Secret Manager), `PAYWALL_ENABLED`.
Gizli anahtar **mobilde yoktur ve olmayacaktır** (bkz. `CLAUDE.md` §5).

## 12. Test stratejisi

- Saf fonksiyonlar ve servisler: Jest (`jest-expo`) birim testleri (⏳ Adım 2). Öncelik: kombin kuralları,
  `computeResizeDimensions`, `validateBodyPhoto`, `runTryOnJob` (sahte zamanlayıcı), hata eşlemesi, hak kuralları.
- Hook'lar/ekranlar: `@testing-library/react-native` ile kritik akışlar.
- Backend: Firebase Emulator Suite ile Functions + Firestore + Storage testleri; Replicate çağrıları stub'lanır.
- Manuel: önce iPhone (Expo Go, sonra development build), ardından Android.
