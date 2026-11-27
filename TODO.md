# TODO.md — Görev Listesi

Kural: Her adım **küçük, bağımsız ve test edilebilir**. Bir seferde yalnızca bir adım uygulanır.
Bitince `[x]` işaretle, "Nasıl test edilir"i doğrula, gerekiyorsa `SPEC.md` / `ARCHITECTURE.md`'yi güncelle.

---

## [x] Adım 1 — Proje iskeleti, navigasyon ve boy fotoğrafı seçme/çekme
- Expo SDK 58 + TypeScript projesi, Expo Router (`src/app`), `@/` import alias'ı.
- Rotalar: `/` (karşılama), `/capture/body`, yer tutucu `/capture/garment`, `/processing`, `/result`.
- `imagePickerService` (izin + kamera/galeri), `TryOnSessionContext` (`bodyPhoto`), `useBodyPhotoPicker`.
- Boy fotoğrafı ekranı: önizleme, *Fotoğraf çek* / *Galeriden seç*, kadraj ipuçları, izin hataları, *Devam et*.
- **Nasıl test edilir:** `npx expo start` → Expo Go. Başla → Fotoğraf çek / Galeriden seç → önizleme görünür,
  *Devam et* aktifleşir → yer tutucu ürün ekranı açılır. İzni reddet → hata kutusu; kalıcı reddet → *Ayarları aç*.
  `npx tsc --noEmit` hatasız.

## [ ] Adım 2 — Kalite altyapısı: lint + test
- `npx expo lint` ile ESLint kurulumu; `jest-expo` + `@testing-library/react-native` kurulumu, `npm test` script'i.
- İlk test: `TryOnSessionContext` reducer'ı (set / clear / reset).
- **Nasıl test edilir:** `npm run lint`, `npm test`, `npx tsc --noEmit` temiz.

## [ ] Adım 3 — Boy fotoğrafı doğrulama ve uyarılar
- Saf fonksiyon `validateBodyPhoto(image)` → `'landscape' | 'low-resolution'` uyarıları (+ birim testi).
- Boy fotoğrafı ekranında engellemeyen uyarı kartı.
- **Nasıl test edilir:** Yatay/küçük fotoğraf seç → uyarı görünür, *Devam et* yine aktif. Testler geçer.

## [ ] Adım 4 — Görsel hazırlama servisi (sıkıştırma/boyutlandırma)
- `expo-image-manipulator` ekle (gerekçe CLAUDE.md tablosuna).
- `computeResizeDimensions` (saf, testli) + `prepareImage(image, preset)` (ARCHITECTURE §3 kuralları).
- Geçici geliştirici çıktısı: hazırlanmış boyut/byte bilgisini konsola yaz.
- **Nasıl test edilir:** Birim testleri; büyük bir fotoğrafta sonucun ≤ 1536 px ve ≤ 1.5 MB olduğunu logdan doğrula.

## [ ] Adım 5 — Ürün fotoğrafı ekranı
- Oturuma `garments` + `activeGarmentId` ekle (reducer testleriyle).
- Ürün ekle (kamera/galeri), liste, seç, sil, *Değiştir* (boy fotoğrafına dön), en fazla 10 ürün.
- *Üzerimde dene* butonu şimdilik `/processing` yer tutucusuna gider.
- **Nasıl test edilir:** 2–3 ürün ekle/sil/seç; boy fotoğrafını değiştirip geri dön, ürünler korunur.

## [ ] Adım 6 — Try-on servis sözleşmesi + mock servis + iş yürütücü
- `services/tryOn/types.ts`, `mockTryOnService` (senaryolarla), `runTryOnJob` (polling/timeout/iptal).
- Birim testleri: başarı, zaman aşımı, art arda geçici hata, iptal (sahte zamanlayıcı).
- **Nasıl test edilir:** `npm test`; UI değişikliği yok.

## [ ] Adım 7 — İşleniyor ekranı
- `useTryOnJob` hook'u: hazırla → submit → poll; aşama metinleri, ilerleme, *İptal et*, uzun sürme mesajı.
- Başarıda `/result`'a, hatada hata görünümüne geçiş. `AppState` ile duraklat/devam.
- **Nasıl test edilir:** Mock `success` → ~8 sn sonra sonuç; `slow` → "uzun sürüyor" mesajı; iptal → ürün ekranına dönüş.

## [ ] Adım 8 — Sonuç ekranı (görüntüleme + tekrar deneme)
- Sonuç görseli, önce/sonra (basılı tut), *Tekrar dene*, *Başka ürün dene*, AI uyarı notu.
- Denenmiş ürüne dokununca doğrudan sonuç açılması.
- **Nasıl test edilir:** Mock ile uçtan uca akış; başka ürün → ürün ekranı, boy fotoğrafı korunur.

## [ ] Adım 9 — Kaydet ve paylaş
- `expo-media-library` (yalnızca yazma izni) ve `expo-sharing` ekle (gerekçeli). Sonucu yerel önbelleğe indirme.
- **Nasıl test edilir:** Kaydet → galeride görünür; izin reddi → açıklama; Paylaş → sistem sayfası.

## [ ] Adım 10 — Merkezi hata eşlemesi ve hata görünümleri
- `TryOnErrorCode` → Türkçe mesaj + aksiyon eşlemesi (SPEC §5 tablosu), ortak `ErrorState` bileşeni.
- Mock senaryolarıyla tüm hata durumlarını gezen geliştirici menüsü (sadece `__DEV__`).
- **Nasıl test edilir:** Her mock senaryosunda doğru mesaj ve aksiyon; eşleme birim testi.

## [ ] Adım 11 — Gerçek HTTP servis adaptörü
- `httpTryOnService` (ARCHITECTURE §4.2), HTTP hata eşlemesi testleri, `env` ile seçim, `.env.example` güncel.
- **Nasıl test edilir:** Birim testleri (fetch mock). Backend hazırsa `EXPO_PUBLIC_USE_MOCK=false` ile uçtan uca.

## [ ] Adım 12 — Cilalama
- İkon/splash, erişilebilirlik turu, küçük ekran düzenleri, haptik geri bildirim, performans (büyük görsel bellek kullanımı).

---

### Notlar / ertelenenler
- Canlı kamera üzerinde kadraj overlay'i (`expo-camera` ile özel kamera ekranı) — Adım 12 sonrası değerlendirilecek.
- Backend proxy ayrı bir proje olarak ele alınacak; sözleşme ARCHITECTURE §4.2'de.
