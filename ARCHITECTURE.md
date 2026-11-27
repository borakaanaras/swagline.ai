# ARCHITECTURE.md — Teknik Mimari

> Bu dosya "nasıl" sorusunu cevaplar. Ürün davranışı için `SPEC.md`, kurallar için `CLAUDE.md`.

## 1. Katmanlar

```
┌──────────────────────────────────────────────────────────────┐
│ src/app (routes)          ince; sadece ekranı bağlar          │
├──────────────────────────────────────────────────────────────┤
│ src/features/*/screens    ekran düzeni                         │
│ src/features/*/hooks      akış mantığı (servis çağır, durumu   │
│                           güncelle, UI'a loading/error ver)    │
├──────────────────────────────────────────────────────────────┤
│ src/store                 oturum durumu (Context + reducer)    │
├──────────────────────────────────────────────────────────────┤
│ src/services              dış dünya: picker, görsel işleme,    │
│                           try-on API (mock | http)             │
└──────────────────────────────────────────────────────────────┘
            mobil uygulama  ──HTTPS──►  SwaglineAI backend proxy  ──►  AI try-on sağlayıcısı
                                         (API anahtarı burada)
```

- **Bağımlılık yönü yukarıdan aşağıya.** Servisler React'i bilmez (saf TS), bu yüzden birim testi kolaydır.
- Domain tipleri `src/types/` altındadır (`LocalImage` vb.). Servisler 3. parti tipleri bu tiplere dönüştürür.

### Mevcut dosyalar (Adım 1)

| Dosya | Sorumluluk |
|---|---|
| `src/services/media/imagePickerService.ts` | İzin kontrol/isteme, kamera/galeri açma, sonucu `PickImageResult`'a çevirme |
| `src/store/TryOnSessionContext.tsx` | `bodyPhoto` durumunu tutar (`setBodyPhoto`, `clearBodyPhoto`, `reset`) |
| `src/features/body-photo/hooks/useBodyPhotoPicker.ts` | Servis sonucunu oturuma yazar, `loadingSource` / `error` üretir |
| `src/features/body-photo/screens/BodyPhotoScreen.tsx` | Ekran düzeni |
| `src/config/env.ts` | Herkese açık ortam değerleri, mock/gerçek servis seçimi |

## 2. Oturum durumu (hedef model)

```ts
type GarmentItem = {
  id: string;                 // istemci tarafında üretilen uuid
  image: LocalImage;
  category: GarmentCategory;  // 'auto' | 'top' | 'bottom' | 'dress' | 'outerwear'
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: TryOnResult;
  error?: TryOnError;
};

type TryOnSessionState = {
  bodyPhoto: LocalImage | null;     // ✅ Adım 1
  garments: GarmentItem[];          // ⏳ Adım 5
  activeGarmentId: string | null;   // ⏳ Adım 5
  activeJob: { jobId: string; garmentId: string } | null; // ⏳ Adım 7
};
```

Boy fotoğrafı değişirse tüm ürünlerin `result`'ı geçersiz sayılır (`status → 'idle'`).

## 3. Görsel hazırlama: sıkıştırma ve boyutlandırma (yüklemeden önce)

Amaç: yükleme süresini ve maliyeti düşürmek, servisin beklediği boyut aralığında kalmak, EXIF/konum verisini atmak.

- Modül: `src/services/image/imageProcessor.ts` (⏳ Adım 4), paket: `expo-image-manipulator` (resmi Expo modülü).
- Kurallar:
  | Görsel | Uzun kenar (max) | Format | Kalite | Hedef boyut |
  |---|---|---|---|---|
  | Boy fotoğrafı | 1536 px | JPEG | 0.85 | ≤ 1.5 MB |
  | Ürün fotoğrafı | 1024 px | JPEG | 0.85 | ≤ 1 MB |
- Adımlar:
  1. EXIF yönelimini uygula (manipulator yeniden kodlarken düzeltir), meta veriyi at.
  2. Uzun kenar sınırı aşıyorsa en-boy oranını koruyarak küçült; küçükse **büyütme**.
  3. JPEG olarak kaydet. Hedef boyutu aşarsa kaliteyi 0.85 → 0.7 → 0.55 düşürerek en fazla 2 kez daha dene.
  4. Sonuç `PreparedImage { uri, width, height, sizeBytes, mimeType: 'image/jpeg' }`.
- Boyut hesabı saf bir fonksiyondur ve birim testlidir:
  `computeResizeDimensions({ width, height }, maxLongEdge) → { width, height }`.
- Doğrulama (⏳ Adım 3), saf fonksiyon: `validateBodyPhoto(image) → BodyPhotoWarning[]`
  (`'landscape'` en/boy > 1, `'low-resolution'` kısa kenar < 512 px).

## 4. AI try-on servis sözleşmesi

### 4.1 İstemci arayüzü (`src/services/tryOn/types.ts`, ⏳ Adım 6)

```ts
export interface TryOnService {
  /** İşi başlatır; görseller önceden hazırlanmış (sıkıştırılmış) olmalı. */
  submit(request: TryOnRequest, signal?: AbortSignal): Promise<TryOnSubmitResponse>;
  /** İşin güncel durumunu döndürür. */
  getStatus(jobId: string, signal?: AbortSignal): Promise<TryOnJobStatus>;
  /** İşi iptal eder (best-effort). */
  cancel(jobId: string): Promise<void>;
}

export type TryOnRequest = {
  bodyImage: PreparedImage;
  garmentImage: PreparedImage;
  category: GarmentCategory;        // 'auto' varsayılan
  clientRequestId: string;          // idempotency anahtarı (uuid)
};

export type TryOnSubmitResponse = { jobId: string; estimatedSeconds?: number };

export type TryOnJobStatus =
  | { state: 'queued'; position?: number }
  | { state: 'processing'; progress?: number }          // 0..1
  | { state: 'succeeded'; result: TryOnResult }
  | { state: 'failed'; error: TryOnError }
  | { state: 'cancelled' };

export type TryOnResult = { imageUrl: string; width: number; height: number; expiresAt?: string };

export type TryOnErrorCode =
  | 'NETWORK' | 'TIMEOUT' | 'RATE_LIMITED' | 'SERVER'
  | 'INVALID_BODY_IMAGE' | 'INVALID_GARMENT_IMAGE' | 'UNSUPPORTED_CATEGORY'
  | 'CANCELLED' | 'UNKNOWN';

export type TryOnError = { code: TryOnErrorCode; message?: string; retryable: boolean };
```

`src/services/tryOn/index.ts` → `env.useMockServices` ise `mockTryOnService`, değilse `httpTryOnService` export eder.
UI sadece `index.ts`'i import eder.

### 4.2 Backend proxy HTTP sözleşmesi (öneri)

| İstek | Gövde | Yanıt |
|---|---|---|
| `POST /v1/try-on/jobs` | `multipart/form-data`: `body_image` (jpeg), `garment_image` (jpeg), `category`, header `Idempotency-Key: <clientRequestId>` | `202 { "job_id": "...", "estimated_seconds": 20 }` |
| `GET /v1/try-on/jobs/:id` | — | `200 { "state": "queued"\|"processing"\|"succeeded"\|"failed"\|"cancelled", "progress": 0.4, "result": { "image_url": "...", "width": 768, "height": 1024, "expires_at": "..." }, "error": { "code": "INVALID_BODY_IMAGE", "message": "..." } }` |
| `DELETE /v1/try-on/jobs/:id` | — | `204` |

- HTTP hata eşlemesi: ağ hatası → `NETWORK`; `408/504` → `TIMEOUT`; `429` → `RATE_LIMITED` (`Retry-After` dikkate alınır);
  `5xx` → `SERVER` (retryable); `4xx` gövdedeki `error.code`'a göre.
- Kimlik doğrulama (ileride): cihaz başına anonim token; sağlayıcı anahtarı **yalnızca backend'de**.
- `snake_case` ↔ `camelCase` dönüşümü sadece `httpTryOnService` içinde yapılır.

## 5. Bekleme, polling ve timeout mantığı

Yürütücü: `src/services/tryOn/runTryOnJob.ts` (⏳ Adım 6), saf TS, React'ten bağımsız, sahte zamanlayıcı ile test edilebilir.

```
prepare images ─► submit ─► poll loop ─► succeeded | failed | cancelled | timeout
```

- **Submit:** 15 sn istek zaman aşımı. Ağ/5xx hatasında üstel geri çekilme ile en fazla 2 tekrar (1 sn, 2 sn).
  Aynı `clientRequestId` kullanıldığı için tekrar güvenlidir.
- **Polling aralığı:** ilk sorgu 2 sn sonra; ardından `min(önceki × 1.5, 5 sn)` (2 → 3 → 4.5 → 5 → 5 …).
- **Tek sorgu zaman aşımı:** 10 sn. Geçici hata (ağ/5xx) polling'i bitirmez; art arda 3 geçici hata → `NETWORK`/`SERVER`.
- **Genel zaman aşımı:** submit'ten itibaren 90 sn → `TIMEOUT` (best-effort `cancel` çağrılır).
- **İptal:** `AbortController`; kullanıcı iptal ederse bekleyen istek kesilir, `cancel(jobId)` çağrılır, sonuç `CANCELLED`.
- **İlerleme olayları:** `onProgress({ phase: 'preparing' | 'uploading' | 'queued' | 'processing', progress? })`
  → İşleniyor ekranı bu olaylara göre metin değiştirir.
- **Arka plan:** `AppState` `background` iken polling duraklatılır, `active` olunca hemen bir sorgu yapılıp devam edilir.
  Genel zaman aşımı duvar saati ile ölçülür.
- Sonuç görseli `imageUrl` geçici olabilir; Sonuç ekranı açılınca yerel önbelleğe indirilir (Kaydet/Paylaş için).

## 6. Mock (sahte) servis katmanı

Gerçek API hazır olana kadar tüm akış `mockTryOnService` ile çalışır (`EXPO_PUBLIC_USE_MOCK` varsayılan `true`).

- `TryOnService` arayüzünü birebir uygular; UI hangi servisin çalıştığını bilmez.
- Davranış:
  - `submit`: 300–600 ms gecikme, `job_<n>` döndürür.
  - `getStatus`: işin başlangıç zamanına göre `queued` (0–2 sn) → `processing` (progress 0→1, ~6 sn) → `succeeded`.
  - Sonuç görseli: şimdilik **ürün fotoğrafının kendisi** (veya boy fotoğrafı üzerine ürünü bindiren basit bir kompozisyon,
    ileride). Amaç akışı test etmek, kaliteyi değil.
- **Senaryo seçimi** (geliştirici için): `mockTryOnService.configure({ scenario })`
  `'success' | 'slow' (35 sn) | 'timeout' | 'invalid-body' | 'invalid-garment' | 'network-flaky' | 'rate-limited'`.
  Böylece SPEC'teki her hata durumu gerçek API olmadan denenebilir.
- Mock yalnızca `__DEV__` veya `EXPO_PUBLIC_USE_MOCK=true` iken seçilebilir; üretim derlemesinde `http` zorunludur.

## 7. Ortam değişkenleri

| Değişken | Örnek | Not |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.swagline.ai` | Herkese açık; kendi backend'imiz |
| `EXPO_PUBLIC_USE_MOCK` | `true` | `false` olunca http servisi kullanılır |

Gizli anahtar **yoktur ve olmayacaktır** (bkz. `CLAUDE.md` §5). Örnek: `.env.example`.

## 8. Test stratejisi

- Saf fonksiyonlar ve servisler: Jest (`jest-expo` preset) ile birim testi (⏳ Adım 2).
  Öncelik: `computeResizeDimensions`, `validateBodyPhoto`, `runTryOnJob` (sahte zamanlayıcı), HTTP hata eşlemesi.
- Hook'lar/ekranlar: `@testing-library/react-native` ile kritik akışlar (izin reddi, vazgeçme, devam butonu).
- Manuel: Expo Go'da iOS + Android'de kamera/galeri akışı.
