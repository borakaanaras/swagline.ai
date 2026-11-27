/**
 * Cihazda bulunan (henüz sunucuya yüklenmemiş) bir görsel.
 * Picker / kamera çıktısı bu tipe dönüştürülür; uygulamanın geri kalanı
 * expo-image-picker tiplerini doğrudan bilmez.
 */
export type LocalImage = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileSize?: number;
};

export type ImageSource = 'camera' | 'library';

/**
 * Yüklemeye hazır (sıkıştırılmış/boyutlandırılmış) görsel.
 * `imageProcessor.prepareImage` üretir: EXIF'siz, boyutlandırılmış JPEG.
 */
export type PreparedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes?: number;
  /** JPEG verisinin base64 hali (geliştirme sunucusuna JSON ile göndermek için). */
  base64?: string;
};
