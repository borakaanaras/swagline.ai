/**
 * Marka paleti ve tasarım tokenları.
 *
 * Tasarım dili — "kabin aynası": Uygulamanın tek cesur öğesi, kemerli butik aynası biçimindeki
 * fotoğraf çerçevesidir (`Mirror`). Geri kalan her şey sakin kalır.
 * - Indigo (`primary`) yalnızca kullanıcının yapacağı aksiyonlar içindir.
 * - Cyan (`accent`) yalnızca AI çalışırken / AI'a ait şeylerde görünür (tarama çizgisi, AI rozetleri).
 */
export const colors = {
  /** Kabin siyahı — arka plan */
  background: '#0F0F12',
  /** Perde — kartlar / yüzeyler */
  surface: '#1C1C24',
  /** Yüzey üstü ikincil alan */
  surfaceAlt: '#262631',
  border: '#2E2E3A',
  /** Ayna çerçevesinin dış kenarı */
  frame: '#3A3A4A',
  /** Ayna camının iç parıltısı */
  glass: 'rgba(248, 250, 252, 0.07)',
  /** Buz — birincil metin */
  text: '#F8FAFC',
  /** Sis — ikincil metin */
  textMuted: '#94A3B8',
  /** Electric Indigo — CTA / birincil aksiyon */
  primary: '#6366F1',
  primaryText: '#F8FAFC',
  /** Seçili öğenin indigo zemini */
  primarySurface: 'rgba(99, 102, 241, 0.16)',
  /** Cyber Cyan — yalnızca AI etkileşimi */
  accent: '#22D3EE',
  accentText: '#0F0F12',
  accentSurface: 'rgba(34, 211, 238, 0.14)',
  /** Taramanın arkasında kalan ışık izi */
  accentTrail: 'rgba(34, 211, 238, 0.10)',
  danger: '#F87171',
  dangerSurface: 'rgba(248, 113, 113, 0.12)',
  /** Modal arkasındaki ve görsel üstü karartma */
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

/** Tek aile: Bricolage Grotesque (Türkçe karakterleri içerir). Anahtarlar `useFonts` ile yüklenir. */
export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  extrabold: 'BricolageGrotesque_800ExtraBold',
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
  pill: 999,
} as const;

/** Tip ölçeği: 13 · 16 · 20 · 30 · 44 (yaklaşık 1.25–1.5 oranlı modüler ölçek). */
export const typography = {
  display: {
    fontFamily: fonts.extrabold,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.4,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.text,
  },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.text },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textMuted },
} as const;
