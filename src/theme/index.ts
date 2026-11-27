export const colors = {
  background: '#0E0E10',
  surface: '#1A1A1F',
  surfaceAlt: '#24242B',
  border: '#2E2E36',
  text: '#F5F5F7',
  textMuted: '#A1A1AA',
  primary: '#E8FF59',
  primaryText: '#0E0E10',
  danger: '#FF5C5C',
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
