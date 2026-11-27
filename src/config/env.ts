/**
 * Ortam yapılandırması.
 *
 * KURAL: Buraya ASLA gizli API anahtarı konmaz. EXPO_PUBLIC_* değişkenleri
 * uygulama paketine gömülür ve herkes tarafından okunabilir. Yalnızca
 * herkese açık değerler burada olur.
 */
export type TryOnBackend = 'mock' | 'dev-server';

const backend: TryOnBackend = process.env.EXPO_PUBLIC_TRYON_BACKEND === 'dev-server' ? 'dev-server' : 'mock';

export const env = {
  /** Hangi try-on servisi kullanılacak. `firebase` Adım 14'te eklenecek. */
  tryOnBackend: backend,
  /** true ise gerçek servis yerine mock try-on servisi kullanılır. */
  useMockServices: backend === 'mock',
  /** Geçici yerel geliştirme sunucusunun adresi (ör. http://192.168.1.10:8787). */
  devServerUrl: process.env.EXPO_PUBLIC_DEV_SERVER_URL ?? '',
  /**
   * Yerel sunucuya erişim anahtarı. GİZLİ DEĞİLDİR (pakete gömülür); yalnızca aynı Wi-Fi'daki
   * başka cihazların sunucuyu kullanmasını zorlaştırır. Replicate token'ı burada DEĞİL, sunucudadır.
   */
  devServerKey: process.env.EXPO_PUBLIC_DEV_SERVER_KEY ?? '',
  /**
   * false ise ücretsiz deneme limiti ve ödeme ekranı devre dışıdır (geliştirme).
   * Bu sadece istemci tarafı bir UI bayrağıdır; asıl hak kontrolü backend'de yapılır
   * (backend'de de ayrı bir geliştirme bayrağı vardır, bkz. ARCHITECTURE.md §8).
   */
  paywallEnabled: process.env.EXPO_PUBLIC_PAYWALL_ENABLED === 'true',
} as const;
