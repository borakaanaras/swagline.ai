/**
 * Ortam yapılandırması.
 *
 * KURAL: Buraya ASLA gizli API anahtarı konmaz. EXPO_PUBLIC_* değişkenleri
 * uygulama paketine gömülür ve herkes tarafından okunabilir. Yalnızca
 * herkese açık değerler (ör. kendi backend proxy'mizin adresi) burada olur.
 */
export const env = {
  /** Kendi backend proxy'mizin adresi. Boşsa mock servis kullanılır. */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  /** true ise gerçek servis yerine mock try-on servisi kullanılır. */
  useMockServices: (process.env.EXPO_PUBLIC_USE_MOCK ?? 'true') !== 'false',
  /**
   * false ise ücretsiz deneme limiti ve ödeme ekranı devre dışıdır (geliştirme).
   * Bu sadece istemci tarafı bir UI bayrağıdır; asıl hak kontrolü backend'de yapılır
   * (backend'de de ayrı bir geliştirme bayrağı vardır, bkz. ARCHITECTURE.md §8).
   */
  paywallEnabled: process.env.EXPO_PUBLIC_PAYWALL_ENABLED === 'true',
} as const;
