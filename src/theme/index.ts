/**
 * Marka paleti (bkz. CLAUDE.md §2 "Tasarım"). Yeni renk eklemeden önce buradakileri kullan.
 */
export const colors = {
  /** Arka plan — Dark Neutral (derin siyah/kömür) */
  background: '#0F0F12',
  /** Kartlar / yüzeyler — koyu kül grisi */
  surface: '#1C1C24',
  /** Yüzey üstü ikincil alan (surface'ın bir ton açığı) */
  surfaceAlt: '#262631',
  border: '#2E2E3A',
  /** Birincil metin — buz beyazı */
  text: '#F8FAFC',
  /** İkincil metin — sönük gri */
  textMuted: '#94A3B8',
  /** CTA / birincil aksiyon — Electric Indigo */
  primary: '#6366F1',
  primaryText: '#F8FAFC',
  /** AI etkileşimi vurgusu (işleniyor, AI rozetleri) — Cyber Cyan */
  accent: '#22D3EE',
  accentText: '#0F0F12',
  /** accent'in saydam zemini (AI rozetleri, bilgi notları) */
  accentSurface: 'rgba(34, 211, 238, 0.12)',
  /** primary'nin saydam zemini (seçili öğeler) */
  primarySurface: 'rgba(99, 102, 241, 0.16)',
  /** Modal arkasındaki karartma */
  overlay: 'rgba(0, 0, 0, 0.6)',
  danger: '#F87171',
  dangerSurface: 'rgba(248, 113, 113, 0.12)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
} as const;
