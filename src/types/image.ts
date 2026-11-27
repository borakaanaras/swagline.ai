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
