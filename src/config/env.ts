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
} as const;
