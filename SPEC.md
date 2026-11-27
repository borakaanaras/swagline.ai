# SPEC.md — Ürün Akışı ve Ekranlar

> Durum etiketleri: ✅ uygulandı · 🚧 iskelet var · ⏳ planlandı. Adım numaraları `TODO.md` ile eşleşir.

## 0. Genel akış

```
Karşılama ─► (Giriş: Apple / Google) ─► (1) Boy fotoğrafı ─► (2) Kombin oluştur ─► [Hak kontrolü] ─► (3) İşleniyor ─► (4) Sonuç
                                              ▲                     ▲                    │                 │               │
                                              │                     └──── ürün değiştir ◄┼─── Paywall ◄────┘               │
                                              └─────────── fotoğrafı değiştir ◄──────────┴──────────── (5) Hata ◄──────────┤
                                                                                                                            ▼
                                                                                          Geçmiş / Favoriler (cihazda) ◄── kaydedilir
```

- Bir **oturum** = 1 boy fotoğrafı + ürün havuzu (en fazla 10 ürün) + o an seçili **kombin** (her yuvadan en fazla 1 ürün).
- Boy fotoğrafı cihazda saklanır; kullanıcı her denemede tekrar çekmek zorunda kalmaz (*Değiştir* ile yenilenir).
- Görseller, sonuçlar, geçmiş ve favoriler **yalnızca cihazda** tutulur. Sunucu görsel saklamaz.
- Uygulama dili Türkçe.

## Karşılama ✅ (`/`)

- Marka adı, boş kabin aynası (açılışta tek bir cyan tarama), "Almadan önce üzerinde gör." başlığı, tek cümle açıklama, **Kabine gir** butonu.
- ⏳ Adım 16 sonrası: giriş yapılmamışsa *Apple ile devam et* / *Google ile devam et*. Giriş yapılmışsa doğrudan boy fotoğrafına
  (kayıtlı boy fotoğrafı varsa Kombin ekranına).

## Giriş ⏳ (`/sign-in`, Adım 16)

- *Apple ile giriş* (iOS'ta birincil, App Store kuralı gereği Google varsa Apple da olmalı) ve *Google ile giriş*.
- Giriş, ücretsiz deneme hakkını kişiye bağlamak ve ödemeyi doğrulamak için gerekir. Görseller hesaba yüklenmez.
- Geliştirme sırasında (`EXPO_PUBLIC_PAYWALL_ENABLED=false`) giriş atlanabilir.
- Hesabı silme seçeneği (Ayarlar), App Store zorunluluğu.

## (1) Kullanıcı fotoğrafı çekme/seçme ✅ (`/capture/body`)

**Amaç:** Denenecek ürüne uygun kadrajda net bir fotoğraf almak. Tam boy zorunlu değil.

- **Tek ekran, kaydırma yok.** Başlık + kalan alanı dolduran önizleme + alta sabit butonlar.
- **Önizleme:** Fotoğraf yoksa "Ne deneyeceksin?" rehberi: 👗 kombin/alt/elbise/ayakkabı → *Boydan çek*,
  👕 üst/ceket → *Belden yukarısı yeter*, 🕶️ gözlük/şapka/takı → *Yüzün net görünsün*. Varsa tamamı (`contain`).
- **"Nasıl çekmeliyim?"** (başlığın sağında): aynı rehber + genel ipuçları (önden, dik, sade arka plan, bol ışık, bölge kapanmasın).
- **Butonlar (alt):** *Fotoğraf çek* / *Yeniden çek*, *Galeriden seç*; fotoğraf seçilince *Devam et* belirir.
- **İzinler:** Reddedilirse açıklama + *Tekrar dene*; kalıcı reddedildiyse *Ayarları aç*.
- **Vazgeçme:** Picker kapatılırsa mevcut fotoğraf korunur, hata gösterilmez.
- ⏳ **Doğrulama (Adım 3):** Kısa kenarı 512 px'ten küçükse engellemeyen uyarı.
- ⏳ İleride: canlı kamera üzerinde kadraj overlay'i.

## (2) Kombin oluşturma — ürün fotoğrafı seçme ✅ (`/capture/garment`, Adım 5)

**Ürün yuvaları (kategori):**

| Yuva | Örnek | Not |
|---|---|---|
| `top` (Üst) | tişört, gömlek, kazak | `dress` ile birlikte seçilemez |
| `bottom` (Alt) | pantolon, etek, şort | `dress` ile birlikte seçilemez |
| `dress` (Elbise / tulum) | elbise, tulum | `top` ve `bottom`'ı kaldırır |
| `outerwear` (Dış giyim) | ceket, mont | |
| `shoes` (Ayakkabı) | | |
| `eyewear` (Gözlük) | gözlük, güneş gözlüğü | |
| `accessory` (Aksesuar) | çanta, şapka, takı, saat | Kombinde en fazla 1 aksesuar (ilk sürüm) |

**Ekran (sade, az metin):**
- Üstte boy fotoğrafı küçük resmi + *Değiştir*.
- Izgaradaki *+ Ürün ekle* kutucuğu (havuz boşken tam genişlik) → *Fotoğraf çek* / *Galeriden seç* seçimi. Eklenince:
  1. Arka plan **otomatik temizlenecek** şekilde işaretlenir (temizleme deneme sırasında sunucuda yapılır, bkz. ARCHITECTURE §4).
     Kartta "✦ Arka plan silinecek" rozeti; rozete dokununca "Orijinal" olur (ve geri).
  2. Kategori sorulur (alttan açılan yuva seçici). *Vazgeç* derse ürün eklenmez. İleride otomatik tahmin.
  3. Eklenen ürün doğrudan kombine girer (kurallar uygulanır).
- **Ürün havuzu:** 2 sütunlu ızgara; her kart küçük resim, kategori etiketi (dokununca kategori değiştirilir), sil (×),
  seçiliyse indigo çerçeve + ✓. En fazla 10 ürün; dolunca *+ Ürün ekle* kutucuğu gizlenir.
- **Kombin çubuğu (alt):** seçili ürünler yuva sırasıyla. Bir karta dokunmak onu kombine ekler/çıkarır.
  Aynı yuvada başka ürün seçilirse eskisinin yerine geçer; `dress` seçilince `top`/`bottom` çıkar (cyan bilgi notu, ~3,5 sn).
- *Üzerimde dene* (boy fotoğrafı var ve en az 1 ürün seçiliyse aktif) → hak kontrolü (⏳) → İşleniyor.
- *Değiştir* boy fotoğrafı ekranına döner; ürün havuzu ve kombin korunur.
- Kamera/galeri izin hataları boy fotoğrafı ekranıyla aynı ortak bileşenle gösterilir.

## Hak kontrolü ve Paywall ⏳ (Adım 17)

- İlk **1 deneme ücretsiz**. Sonraki denemelerde *Üzerimde dene* → Paywall ekranı (paket seçimi, satın al, geri yükle).
- Bir "deneme" = bir kombinin bir kez üretilmesi (kaç parça olursa olsun). Başarısız/iptal olan denemeler hakkı düşürmez.
- Hak sayısı backend'de tutulur (uygulama silinip yüklense de geçerli).
- **Geliştirmede kapalı:** `EXPO_PUBLIC_PAYWALL_ENABLED=false` ve backend'de `PAYWALL_ENABLED=false` iken sınırsız deneme.
- Fiyatlandırma modeli (kredi paketi / abonelik) henüz belirlenmedi.

## (3) Yükleniyor / işleniyor ekranı ✅ (`/processing`, Adım 8)

- Geri hareketi kapalı; *İptal et* (onay sonrası Kombin ekranına döner, iş iptal edilir, hak düşmez).
- Tek ekran: kullanıcının fotoğrafı kabin aynasında karartılmış, üzerinde sürekli cyan tarama çizgisi; altında aşama başlığı, cyan adım (2 / 3), ince ilerleme çubuğu, süre metni; altta *İptal et*.
- Aşamalar:
  1. *Fotoğraflar hazırlanıyor* (sıkıştırma)
  2. *Yükleniyor*
  3. *Sıraya alındı*
  4. *Arka planlar temizleniyor*
  5. *Giydiriliyor: Üst* + "1 / 3" — çoklu parça sırayla giydirilir
- Beklenen süre metni (parça sayısına göre: "Yaklaşık 20–60 sn").
- 30 sn × parça sayısı aşılırsa "Biraz uzun sürüyor, bekliyoruz…". Zaman aşımı → Hata.
- **Hata görünümü** aynı ekranda: başlık + tek cümle + birincil aksiyon (*Tekrar dene* / *Boy fotoğrafını değiştir* /
  *Kombini değiştir*) ve *Kombine dön*. Android geri tuşu iş sürerken iptal onayı açar.
- Uygulama arka plana atılıp dönülürse polling kaldığı yerden devam eder.

## (4) Sonuç ekranı ✅ Adım 9 · ⏳ Adım 10 (`/result`)

- Tek ekran: giydirilmiş görsel kalan alanı doldurur (iOS'ta iki parmakla yakınlaştırma), üstünde *Önce / Sonra* anahtarı.
- Kombindeki ürünlerin küçük resimleri altta; kısmi sonuçta "X giydirilemedi" (kırmızı).
- Sonuç görselinin sol altında yarı saydam **SwaglineAI** filigranı (✦ + yazı; gerçek logo gelince değişecek). *Önce* görünümünde yok.
- Aksiyonlar: ✅ **Görseli indir** (logolu, uzun kenar ≤ 1536 px JPEG → Fotoğraflar; başarıda "Kaydedildi ✓"),
  ✅ **Kombini değiştir**, ✅ **Tekrar dene**; ⏳ **Paylaş** (Adım 10), **Favorilere ekle** (♥, Adım 11).
- Mock ile üretilen sonuçta "Demo · AI henüz bağlı değil" rozeti.
- Her başarılı sonuç otomatik olarak cihazdaki **Geçmiş**'e eklenir.
- Not: "AI tarafından üretildi; gerçek beden ve kalıp farklı olabilir."

## Geçmiş ve Favoriler ⏳ (`/history`, Adım 11)

- Cihazda saklanan tüm sonuçlar, en yeni üstte; *Tümü / Favoriler* sekmesi.
- Her kayıt: sonuç görseli, kombin ürünleri, tarih, favori durumu.
- Kayda dokununca Sonuç ekranı (kayıt modunda) açılır. Sil, favoriye ekle/çıkar.
- Uygulama silinince geçmiş de silinir (kullanıcıya Ayarlar'da belirtilir). Limit: son 100 kayıt (eskiler otomatik silinir, favoriler hariç).

## (5) Hata durumları

Her hata **kullanıcı dostu Türkçe mesaj + net bir sonraki aksiyon** içerir. Teknik ayrıntı kullanıcıya gösterilmez.

| Durum | Nerede | Mesaj / Aksiyon | Durum |
|---|---|---|---|
| Kamera/galeri izni reddedildi | Boy, Kombin | Açıklama + *Tekrar dene* | ✅ |
| İzin kalıcı reddedildi | Boy, Kombin | *Ayarları aç* | ✅ |
| Picker hatası | Boy, Kombin | "Fotoğraf alınırken bir sorun oluştu" + *Tekrar dene* | ✅ |
| Uygun olmayan boy fotoğrafı | Boy | Uyarı, engellemez | ⏳ |
| Arka plan temizlenemedi | Kombin / İşleniyor | "Ürünün arka planını ayıramadık" + *Orijinali kullan* / *Başka fotoğraf* | ⏳ |
| Görsel hazırlanamadı | İşleniyor | "Fotoğraf hazırlanamadı" + *Başka fotoğraf seç* | ✅ (mock) |
| İnternet yok | İşleniyor | "İnternet bağlantını kontrol et" + *Tekrar dene* | ✅ (mock) |
| Sunucu hatası | İşleniyor | "Şu an bağlanamıyoruz" + *Tekrar dene* | ✅ (mock) |
| Kişi bulunamadı | İşleniyor | "Fotoğrafta tam boy bir kişi bulamadık" + *Boy fotoğrafını değiştir* | ✅ (mock) |
| Ürün tanınamadı | İşleniyor | "Ürünü ayırt edemedik" + *Ürünü değiştir* | ✅ (mock) |
| Kategori desteklenmiyor | İşleniyor | "Bu ürün türü henüz desteklenmiyor" + *Kombinden çıkar* | ✅ (mock) |
| Kombinde bir parça başarısız | İşleniyor/Sonuç | Başarılı parçalarla kısmi sonuç + "X giydirilemedi" notu | ✅ (mock) |
| Zaman aşımı | İşleniyor | "İşlem çok uzun sürdü" + *Tekrar dene* | ✅ (mock) |
| Oran sınırı (429) | İşleniyor | "Çok fazla deneme yaptın, biraz sonra tekrar dene" | ✅ (mock) |
| Deneme hakkı bitti | Kombin | Paywall'a yönlendir | ⏳ |
| Giriş başarısız / iptal | Giriş | "Giriş yapılamadı" + *Tekrar dene* | ⏳ |
| Satın alma başarısız | Paywall | Mağaza mesajına göre + *Tekrar dene* | ⏳ |
| Kaydetme izni yok / başarısız | Sonuç | Açıklama + *Ayarları aç* / *Tekrar dene* | ✅ |

## Kapsam dışı (şimdilik)

- Ürün linki yapıştırma / mağaza kataloğu, bulut senkronizasyonu, video try-on, İngilizce dil, B2B mağaza paneli.
