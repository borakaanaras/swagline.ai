# TODO.md — Görev Listesi

Kural: Her adım **küçük, bağımsız ve test edilebilir**. Bir seferde yalnızca bir adım uygulanır.
Bitince `[x]` işaretle, "Nasıl test edilir"i doğrula, gerekiyorsa `SPEC.md` / `ARCHITECTURE.md` / `CLAUDE.md`'yi güncelle.
Manuel testler önce **iPhone**'da yapılır.

Faz A (Adım 1–11): Tamamen cihazda + mock servis, Expo Go'da çalışır.
Faz B (Adım 12–17): Development build, Firebase, gerçek AI, giriş, ödeme.

---

## Faz A — Uygulama akışı (mock ile)

### [x] Adım 1 — Proje iskeleti, navigasyon ve boy fotoğrafı seçme/çekme
- Expo SDK 58 + TypeScript, Expo Router (`src/app`), `@/` alias'ı, marka paleti (`src/theme`).
- Rotalar: `/`, `/capture/body`, yer tutucu `/capture/garment`, `/processing`, `/result`.
- `imagePickerService`, `TryOnSessionContext` (`bodyPhoto`), `useBodyPhotoPicker`, boy fotoğrafı ekranı.
- **Nasıl test edilir:** `npx expo start` → Expo Go. Başla → Fotoğraf çek / Galeriden seç → önizleme, *Devam et* aktif
  → yer tutucu ekran. İzni reddet → hata kutusu; kalıcı reddet → *Ayarları aç*. `npx tsc --noEmit` hatasız.

### [ ] Adım 2 — Kalite altyapısı: lint + test
- `npx expo lint` ile ESLint; `jest-expo` + `@testing-library/react-native`, `npm test` script'i.
- İlk test: `TryOnSessionContext` reducer'ı.
- **Nasıl test edilir:** `npm run lint`, `npm test`, `npx tsc --noEmit` temiz.

### [ ] Adım 3 — Boy fotoğrafı doğrulama ve uyarılar
- Saf `validateBodyPhoto(image)` (+ test); ekranda engellemeyen uyarı kartı; ayakkabı/gözlük için ek ipuçları.
- **Nasıl test edilir:** Yatay/küçük fotoğraf → uyarı, *Devam et* yine aktif.

### [ ] Adım 4 — Görsel hazırlama servisi (sıkıştırma/boyutlandırma)
- `expo-image-manipulator` (gerekçeli). `computeResizeDimensions` (testli) + `prepareImage(image, 'body' | 'garment')`.
- **Nasıl test edilir:** Birim testleri; büyük fotoğrafta sonucun ≤ 1536 px / ≤ 1.5 MB olduğunu geçici logdan doğrula.

### [x] Adım 5 — Kombin ekranı (ürün havuzu + yuvalar)
- Oturuma `garments` + `outfit`; saf `applyGarmentToOutfit` (dress ↔ top/bottom kuralı, testli).
- Ürün ekle (galeri/kamera) → yuva seçici → havuz ızgarası (en fazla 10), sil, kombine ekle/çıkar,
  "Arka plan temizlenecek" rozeti + *Orijinali kullan*, kombin çubuğu, *Üzerimde dene* → yer tutucu `/processing`.
- **Nasıl test edilir:** Üst + alt seç, sonra elbise seç → üst/alt çıkar; ayakkabı + gözlük ekle; boy fotoğrafını değiştirip dön, havuz korunur.
- **Not:** `applyGarmentToOutfit` için birim testi Adım 2 (Jest) kurulunca yazılacak; şimdilik elle doğrulandı.

### [ ] Adım 6 — Try-on sözleşmesi + mock servis + iş yürütücü
- `services/tryOn/types.ts` (çoklu parça, aşamalar), `mockTryOnService` (senaryolar), `runTryOnJob` (polling/timeout/iptal).
- **Nasıl test edilir:** `npm test` — başarı, kısmi sonuç, zaman aşımı, art arda geçici hata, iptal (sahte zamanlayıcı).

### [ ] Adım 7 — Merkezi hata eşlemesi
- `TryOnErrorCode` → Türkçe mesaj + aksiyon (SPEC §5), ortak `ErrorState` bileşeni; mock senaryo seçici geliştirici menüsü (`__DEV__`).
- **Nasıl test edilir:** Eşleme birim testi; menüden senaryo seçilebiliyor.

### [ ] Adım 8 — İşleniyor ekranı
- `useTryOnJob`: hazırla → (upload) → submit → poll; aşama metinleri ("Giydiriliyor: Üst 1/3"), `accent` animasyon,
  *İptal et*, uzun sürme mesajı, `AppState` ile duraklat/devam, hata → `ErrorState`.
- **Nasıl test edilir:** Mock `success` (3 parça) → aşamalar sırayla, sonra `/result`; `slow`, `timeout`, iptal senaryoları.

### [ ] Adım 9 — Sonuç ekranı
- Sonuç görseli, önce/sonra, kombin küçük resimleri, *Tekrar dene*, *Kombini değiştir*, kısmi sonuç notu, AI uyarısı.
- **Nasıl test edilir:** Mock ile uçtan uca; `partial` senaryosunda "X giydirilemedi" notu.

### [ ] Adım 10 — Kaydet ve paylaş
- `expo-media-library` (yalnızca yazma) ve `expo-sharing` (gerekçeli). Sonucu önce cihaza indir.
- **Nasıl test edilir:** Kaydet → Fotoğraflar'da görünür; izin reddi → açıklama; Paylaş → sistem sayfası.

### [ ] Adım 11 — Cihazda depolama: geçmiş, favoriler, kalıcı oturum
- `localStore` (`expo-file-system` + sqlite/AsyncStorage, gerekçeli karar); boy fotoğrafı ve ürün havuzu kalıcı;
  her sonuç geçmişe; `/history` ekranı (*Tümü / Favoriler*), sonuçta ♥ butonu, 100 kayıt sınırı.
- **Nasıl test edilir:** 2 deneme yap, birini favorile, uygulamayı tamamen kapatıp aç → geçmiş, favori, boy fotoğrafı yerinde.

## Faz B — Altyapı, gerçek servis ve gelir

### [ ] Adım 12 — iOS development build (EAS)
- `expo-dev-client`, `eas.json` (development profili), iOS bundle ayarları. Expo hesabı ve Apple Developer hesabı gerekir (kullanıcıya sor).
- **Nasıl test edilir:** iPhone'a development build kurulur, mevcut tüm akış Expo Go'daki gibi çalışır.

### [ ] Adım 13 — Firebase projesi ve backend iskeleti
- **Firebase projesi oluşturmadan önce kullanıcıya sor.** `backend/` klasörü: Functions (TS), Firestore/Storage kuralları,
  Emulator Suite; `startTryOn` / `getTryOnStatus` / `cancelTryOn` Replicate yerine **sahte pipeline** ile.
- **Nasıl test edilir:** Emulator'da Functions testleri; Storage/Firestore kural testleri.

### [ ] Adım 14 — İstemciyi Firebase'e bağlama
- Firebase JS SDK, `EXPO_PUBLIC_FIREBASE_*`, `firebaseTryOnService` (Storage'a upload + callables), `EXPO_PUBLIC_USE_MOCK=false` ile seçim.
- **Nasıl test edilir:** Emulator'a karşı uçtan uca deneme; mock'a geri dönüş çalışıyor.

### [ ] Adım 15 — Replicate pipeline: arka plan temizleme + IDM-VTON zinciri
- Secret Manager'da `REPLICATE_API_TOKEN`, webhook imza doğrulaması, arka plan modeli seçimi (gerekçeli),
  IDM-VTON zincirleme (üst/alt/elbise/dış giyim), ayakkabı/gözlük/aksesuar için model kararı (yoksa `UNSUPPORTED_SLOT`).
- **Nasıl test edilir:** Gerçek bir boy + 2 ürünle deneme; kısmi sonuç; `tmp/` ve `jobs` temizliği doğrulanır.

### [ ] Adım 16 — Apple ve Google ile giriş
- `expo-apple-authentication`, Google Sign-In (gerekçeli), `authService`, `/sign-in` ekranı, çıkış ve hesabı silme.
- **Nasıl test edilir:** iPhone'da her iki sağlayıcıyla giriş; Functions çağrısı kimlikli; hesabı silme çalışıyor.

### [ ] Adım 17 — Ücretsiz deneme hakkı ve ödeme
- `users/{uid}` hak kuralları (rezerv/kesinleştir/iade), `PAYWALL_ENABLED` bayrakları, satın alma kütüphanesi (gerekçeli),
  paywall ekranı, satın alma geri yükleme, sunucu tarafı doğrulama.
- **Nasıl test edilir:** Bayrak kapalı → sınırsız; açık → 1. deneme ücretsiz, 2.'de paywall; sandbox satın alma sonrası deneme açılır.

### [ ] Adım 18 — Cilalama ve App Store hazırlığı
- İkon/splash (paletle), erişilebilirlik turu, küçük ekranlar, haptik, bellek; gizlilik etiketi ve izin metinleri, TestFlight.

---

### Açık kararlar
- Ayakkabı, gözlük ve aksesuar için try-on modeli (IDM-VTON desteklemiyor) — Adım 15.
- Fiyatlandırma modeli (kredi paketi mi abonelik mi) ve satın alma kütüphanesi — Adım 17.
- Firebase istemci SDK'sı: JS SDK mı `@react-native-firebase` mı — Adım 14/16.

### Ertelenenler
- Canlı kamera üzerinde kadraj overlay'i; iOS'ta cihaz içi arka plan temizleme önizlemesi; İngilizce dil; ürün linki/katalog.
