# SPEC.md — Ürün Akışı ve Ekranlar

> Durum etiketleri: ✅ uygulandı · 🚧 iskelet var · ⏳ planlandı. Adım numaraları `TODO.md` ile eşleşir.
> Ürün kararlarının özeti `CLAUDE.md` §1'de.

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

- Marka adı, kısa açıklama, **Başla** butonu.
- ⏳ Adım 16 sonrası: giriş yapılmamışsa *Apple ile devam et* / *Google ile devam et*. Giriş yapılmışsa doğrudan boy fotoğrafına
  (kayıtlı boy fotoğrafı varsa Kombin ekranına).

## Giriş ⏳ (`/sign-in`, Adım 16)

- *Apple ile giriş* (iOS'ta birincil, App Store kuralı gereği Google varsa Apple da olmalı) ve *Google ile giriş*.
- Giriş, ücretsiz deneme hakkını kişiye bağlamak ve ödemeyi doğrulamak için gerekir. Görseller hesaba yüklenmez.
- Geliştirme sırasında (`EXPO_PUBLIC_PAYWALL_ENABLED=false`) giriş atlanabilir.
- Hesabı silme seçeneği (Ayarlar), App Store zorunluluğu.

## (1) Boy fotoğrafı çekme/seçme ✅ (`/capture/body`)

**Amaç:** AI'ın iyi sonuç verebileceği, baştan ayağa, net bir fotoğraf almak.

- **Önizleme alanı (3:4 dikey):** Fotoğraf yoksa kesikli silüet kılavuzu + "Henüz fotoğraf yok". Varsa tamamı (`contain`).
- **Butonlar:** *Fotoğraf çek* / *Yeniden çek* (kamera), *Galeriden seç*, *Devam et* (yalnızca fotoğraf varsa aktif).
- **Kadraj ipuçları:** baştan ayağa kadraj; telefon bel hizasında ve dik; sade arka plan; önden, kollar hafif açık;
  bol ışık, arkadan ışıktan kaçın; vücut hatlarını gösteren ince kıyafetler. ⏳ Ayakkabı denemek için ayaklar, gözlük için yüz net görünmeli.
- **İzinler:** Reddedilirse açıklama + *Tekrar dene*; kalıcı reddedildiyse *Ayarları aç*.
- **Vazgeçme:** Picker kapatılırsa mevcut fotoğraf korunur, hata gösterilmez.
- ⏳ **Doğrulama (Adım 3):** Yatay veya kısa kenarı 512 px'ten küçükse engellemeyen uyarı.
- ⏳ İleride: canlı kamera üzerinde kadraj overlay'i.

## (2) Kombin oluşturma — ürün fotoğrafı seçme ⏳ (`/capture/garment`, Adım 5) — şu an yer tutucu

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

**Ekran:**
- Üstte boy fotoğrafı küçük resmi + *Değiştir*.
- *Ürün ekle*: galeriden seç veya kamerayla çek. Eklenince:
  1. Arka plan **otomatik temizlenecek** şekilde işaretlenir (temizleme deneme sırasında sunucuda yapılır, bkz. ARCHITECTURE §4).
     Kartta "Arka plan temizlenecek" rozeti; kullanıcı isterse *Orijinali kullan* ile kapatır.
  2. Kategori sorulur (yuva seçici). İleride otomatik tahmin, kullanıcı düzeltebilir.
- **Ürün havuzu:** ızgara; her kart küçük resim, kategori etiketi, sil (×). En fazla 10 ürün.
- **Kombin çubuğu (alt):** seçili ürünler yuva sırasıyla. Bir karta dokunmak onu kombine ekler/çıkarır.
  Aynı yuvada başka ürün seçilirse eskisinin yerine geçer; `dress` seçilince `top`/`bottom` çıkar (kısa bilgi notu).
- *Üzerimde dene* (en az 1 ürün seçiliyse aktif) → hak kontrolü → İşleniyor.
- Ürün fotoğrafı ipuçları: ürün tek başına, tamamı görünür, net; askıda veya düz zeminde.

## Hak kontrolü ve Paywall ⏳ (Adım 17)

- İlk **1 deneme ücretsiz**. Sonraki denemelerde *Üzerimde dene* → Paywall ekranı (paket seçimi, satın al, geri yükle).
- Bir "deneme" = bir kombinin bir kez üretilmesi (kaç parça olursa olsun). Başarısız/iptal olan denemeler hakkı düşürmez.
- Hak sayısı backend'de tutulur (uygulama silinip yüklense de geçerli).
- **Geliştirmede kapalı:** `EXPO_PUBLIC_PAYWALL_ENABLED=false` ve backend'de `PAYWALL_ENABLED=false` iken sınırsız deneme.
- Fiyatlandırma modeli (kredi paketi / abonelik) henüz belirlenmedi.

## (3) Yükleniyor / işleniyor ekranı ⏳ (`/processing`, Adım 8) — şu an yer tutucu

- Geri hareketi kapalı; *İptal et* (onay sonrası Kombin ekranına döner, iş iptal edilir, hak düşmez).
- Aşamalar (`accent` renginde AI animasyonu):
  1. *Fotoğraflar hazırlanıyor* (sıkıştırma)
  2. *Yükleniyor*
  3. *Arka planlar temizleniyor*
  4. *Giydiriliyor: Üst (1/3)* — çoklu parça sırayla giydirilir, her parça için alt aşama gösterilir
- Beklenen süre metni (parça sayısına göre: "Yaklaşık 20–60 sn").
- 30 sn × parça sayısı aşılırsa "Biraz uzun sürüyor, bekliyoruz…". Zaman aşımı → Hata.
- Uygulama arka plana atılıp dönülürse polling kaldığı yerden devam eder.

## (4) Sonuç ekranı ⏳ (`/result`, Adım 9–10) — şu an yer tutucu

- Giydirilmiş görsel tam ekran (yakınlaştırılabilir). *Önce / Sonra* (basılı tutunca orijinal).
- Kombindeki ürünlerin küçük resimleri altta.
- Aksiyonlar: **Kaydet** (galeriye), **Paylaş**, **Favorilere ekle** (♥), **Tekrar dene**, **Kombini değiştir**.
- Her başarılı sonuç otomatik olarak cihazdaki **Geçmiş**'e eklenir.
- Not: "Sonuç AI tarafından üretilmiştir; gerçek beden/kalıp farklı olabilir."

## Geçmiş ve Favoriler ⏳ (`/history`, Adım 11)

- Cihazda saklanan tüm sonuçlar, en yeni üstte; *Tümü / Favoriler* sekmesi.
- Her kayıt: sonuç görseli, kombin ürünleri, tarih, favori durumu.
- Kayda dokununca Sonuç ekranı (kayıt modunda) açılır. Sil, favoriye ekle/çıkar.
- Uygulama silinince geçmiş de silinir (kullanıcıya Ayarlar'da belirtilir). Limit: son 100 kayıt (eskiler otomatik silinir, favoriler hariç).

## (5) Hata durumları

Her hata **kullanıcı dostu Türkçe mesaj + net bir sonraki aksiyon** içerir. Teknik ayrıntı kullanıcıya gösterilmez.

| Durum | Nerede | Mesaj / Aksiyon | Durum |
|---|---|---|---|
| Kamera/galeri izni reddedildi | Boy, Kombin | Açıklama + *Tekrar dene* | ✅ (Boy) |
| İzin kalıcı reddedildi | Boy, Kombin | *Ayarları aç* | ✅ (Boy) |
| Picker hatası | Boy, Kombin | "Fotoğraf alınırken bir sorun oluştu" + *Tekrar dene* | ✅ (Boy) |
| Uygun olmayan boy fotoğrafı | Boy | Uyarı, engellemez | ⏳ |
| Arka plan temizlenemedi | Kombin / İşleniyor | "Ürünün arka planını ayıramadık" + *Orijinali kullan* / *Başka fotoğraf* | ⏳ |
| Görsel hazırlanamadı | İşleniyor | "Fotoğraf hazırlanamadı" + *Başka fotoğraf seç* | ⏳ |
| İnternet yok | İşleniyor | "İnternet bağlantını kontrol et" + *Tekrar dene* | ⏳ |
| Sunucu hatası | İşleniyor | "Şu an bağlanamıyoruz" + *Tekrar dene* | ⏳ |
| Kişi bulunamadı | İşleniyor | "Fotoğrafta tam boy bir kişi bulamadık" + *Boy fotoğrafını değiştir* | ⏳ |
| Ürün tanınamadı | İşleniyor | "Ürünü ayırt edemedik" + *Ürünü değiştir* | ⏳ |
| Kategori desteklenmiyor | İşleniyor | "Bu ürün türü henüz desteklenmiyor" + *Kombinden çıkar* | ⏳ |
| Kombinde bir parça başarısız | İşleniyor/Sonuç | Başarılı parçalarla kısmi sonuç + "X giydirilemedi" notu | ⏳ |
| Zaman aşımı | İşleniyor | "İşlem çok uzun sürdü" + *Tekrar dene* | ⏳ |
| Oran sınırı (429) | İşleniyor | "Çok fazla deneme yaptın, biraz sonra tekrar dene" | ⏳ |
| Deneme hakkı bitti | Kombin | Paywall'a yönlendir | ⏳ |
| Giriş başarısız / iptal | Giriş | "Giriş yapılamadı" + *Tekrar dene* | ⏳ |
| Satın alma başarısız | Paywall | Mağaza mesajına göre + *Tekrar dene* | ⏳ |
| Kaydetme izni yok / başarısız | Sonuç | Açıklama + *Ayarları aç* / *Tekrar dene* | ⏳ |

## Kapsam dışı (şimdilik)

- Ürün linki yapıştırma / mağaza kataloğu, bulut senkronizasyonu, video try-on, İngilizce dil, B2B mağaza paneli.
