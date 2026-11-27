# SPEC.md — Ürün Akışı ve Ekranlar

> Durum etiketleri: ✅ uygulandı · 🚧 iskelet var · ⏳ planlandı. Adım numaraları `TODO.md` ile eşleşir.

## 0. Genel akış

```
Karşılama ──► (1) Boy fotoğrafı ──► (2) Ürün seç ──► (3) İşleniyor ──► (4) Sonuç
                     ▲                    ▲                │               │
                     │                    └── başka ürün ◄─┼───────────────┤
                     └──────────── fotoğrafı değiştir ◄────┴── (5) Hata ◄──┘
```

- Bir **oturum** = 1 boy fotoğrafı + N ürün fotoğrafı + her ürün için en fazla 1 güncel sonuç.
- Boy fotoğrafı oturum boyunca saklanır; kullanıcı her ürün için tekrar çekmek zorunda kalmaz.
- Veriler şimdilik sadece bellekte (oturum Context'i) tutulur; uygulama kapanınca silinir.

## Karşılama ekranı ✅ (`/`)

- Marka adı, kısa açıklama, **Başla** butonu → Boy fotoğrafı ekranı.

## (1) Boy fotoğrafı çekme/seçme ✅ (`/capture/body`)

**Amaç:** AI'ın iyi sonuç verebileceği, baştan ayağa, net bir fotoğraf almak.

- **Önizleme alanı (3:4 dikey):** Fotoğraf yoksa kesikli bir silüet kılavuzu + "Henüz fotoğraf yok" metni.
  Fotoğraf varsa tamamı (`contain`) gösterilir.
- **Butonlar:**
  - *Fotoğraf çek* (fotoğraf varsa *Yeniden çek*) → kamera.
  - *Galeriden seç* → fotoğraf kütüphanesi.
  - *Devam et* (alt sabit) → yalnızca fotoğraf varsa aktif; Ürün seç ekranına gider.
- **Kadraj ipuçları kartı:**
  - Baştan ayağa tüm vücut kadrajda olsun.
  - Telefon bel hizasında ve dik (portre) tutulsun.
  - Düz, sade arka plan.
  - Önden, kollar hafif yana açık.
  - Bol ışık, arkadan ışıktan kaçın.
  - Vücut hatlarını gösteren ince kıyafetler.
- **İzinler:** İlk kullanımda sistem izni istenir. Reddedilirse ekranda açıklama + *Tekrar dene*;
  kalıcı reddedildiyse (*bir daha sorma*) *Ayarları aç* butonu.
- **Vazgeçme:** Kullanıcı picker'ı kapatırsa mevcut fotoğraf korunur, hata gösterilmez.
- ⏳ **Doğrulama (Adım 3):** Fotoğraf yatay ise veya kısa kenarı 512 px'ten küçükse uyarı
  ("Daha iyi sonuç için dikey ve net bir fotoğraf kullan"). Uyarı engelleyici değildir; kullanıcı yine de devam edebilir.
- ⏳ İleride: Canlı kamera üzerinde kadraj overlay'i (ayrı native modül gerektirebilir, ertelendi).

## (2) Ürün fotoğrafı seçme ve tek tek deneme ⏳ (`/capture/garment`) — şu an yer tutucu

- Üstte küçük boy fotoğrafı küçük resmi + *Değiştir* bağlantısı (Boy fotoğrafı ekranına döner).
- *Ürün ekle*: galeriden seç veya fotoğrafını çek. Birden fazla ürün eklenebilir (oturum başına en fazla 10).
- Eklenen ürünler yatay bir şerit/ızgara halinde listelenir. Her kart: küçük resim, durum rozeti
  (*Denenmedi* / *Hazır* / *Hata*), sil (×).
- **Tek seferde tek ürün denenir.** Kullanıcı bir ürünü seçer → *Üzerimde dene* → İşleniyor ekranı.
- Daha önce denenmiş ürüne dokunulursa doğrudan Sonuç ekranı açılır (yeniden üretim yapılmaz).
- Ürün fotoğrafı ipuçları: Ürün tek başına, düz zemin üzerinde veya askıda, tamamı görünür, net.
- Ürün kategorisi (üst / alt / elbise / dış giyim) seçimi: varsayılan *Otomatik*; servis desteklerse gönderilir.

## (3) Yükleniyor / işleniyor ekranı ⏳ (`/processing`) — şu an yer tutucu

- Geri hareketi kapalı; yerine *İptal et* butonu (onay sonrası Ürün seç ekranına döner, iş iptal edilir).
- Aşamalar kullanıcıya gösterilir:
  1. *Fotoğraflar hazırlanıyor* (sıkıştırma/boyutlandırma)
  2. *Yükleniyor*
  3. *Kıyafet giydiriliyor* (servis kuyrukta/işliyor; ilerleme varsa yüzde)
- Boy fotoğrafı bulanık arka plan + animasyonlu gösterge. Beklenen süre metni ("Genellikle 15–30 sn sürer").
- 30 sn'yi geçerse "Biraz uzun sürüyor, bekliyoruz…" mesajı. Zaman aşımı (90 sn) → Hata durumu.
- Uygulama arka plana atılıp dönülürse polling kaldığı yerden devam eder.

## (4) Sonuç ekranı ⏳ (`/result`) — şu an yer tutucu

- Giydirilmiş görsel tam ekran (yakınlaştırılabilir). *Önce / Sonra* geçişi (basılı tutunca orijinal).
- Aksiyonlar:
  - **Kaydet** → cihaz galerisine (izin istenir; yalnızca yazma izni). Başarıda kısa bildirim.
  - **Paylaş** → sistem paylaşım sayfası.
  - **Tekrar dene** → aynı ürünle yeniden üretim (İşleniyor ekranı).
  - **Başka ürün dene** → Ürün seç ekranı (boy fotoğrafı korunur).
- Altta küçük not: "Sonuç AI tarafından üretilmiştir; gerçek beden/kalıp farklı olabilir."

## (5) Hata durumları

Her hata **kullanıcı dostu Türkçe mesaj + net bir sonraki aksiyon** içerir. Teknik ayrıntı kullanıcıya gösterilmez.

| Durum | Nerede | Mesaj / Aksiyon | Durum |
|---|---|---|---|
| Kamera/galeri izni reddedildi | Boy, Ürün | Açıklama + *Tekrar dene* | ✅ (Boy) |
| İzin kalıcı reddedildi | Boy, Ürün | *Ayarları aç* | ✅ (Boy) |
| Picker hatası | Boy, Ürün | "Fotoğraf alınırken bir sorun oluştu" + *Tekrar dene* | ✅ (Boy) |
| Uygun olmayan fotoğraf (yatay, küçük) | Boy | Uyarı, engellemez | ⏳ Adım 3 |
| Görsel işlenemedi (sıkıştırma) | İşleniyor | "Fotoğraf hazırlanamadı" + *Başka fotoğraf seç* | ⏳ |
| İnternet yok | İşleniyor | "İnternet bağlantını kontrol et" + *Tekrar dene* | ⏳ |
| Yükleme başarısız / sunucu 5xx | İşleniyor | "Şu an bağlanamıyoruz" + *Tekrar dene* | ⏳ |
| Servis fotoğrafı reddetti (kişi bulunamadı vb.) | İşleniyor | Sebebe göre: "Fotoğrafta tam boy bir kişi bulamadık" + *Boy fotoğrafını değiştir* | ⏳ |
| Ürün tanınamadı | İşleniyor | "Ürünü ayırt edemedik" + *Başka ürün fotoğrafı seç* | ⏳ |
| Zaman aşımı | İşleniyor | "İşlem çok uzun sürdü" + *Tekrar dene* | ⏳ |
| Kota/oran sınırı (429) | İşleniyor | "Çok fazla deneme yaptın, biraz sonra tekrar dene" | ⏳ |
| Kaydetme izni yok / başarısız | Sonuç | Açıklama + *Ayarları aç* / *Tekrar dene* | ⏳ |

## Kapsam dışı (şimdilik)

- Hesap/giriş, bulut geçmişi, ürün mağazası entegrasyonu, video try-on, aynı anda birden çok ürün giydirme.
