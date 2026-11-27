import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

/** Denenecek ürüne göre kadraj rehberi (tek yerde; ayna içi ve rehber penceresi kullanır). */
export const SHOOTING_GUIDE = [
  { icon: '👗', what: 'Kombin, alt, elbise, ayakkabı', how: 'Boydan çek' },
  { icon: '👕', what: 'Üst, ceket', how: 'Belden yukarısı yeter' },
  { icon: '🕶️', what: 'Gözlük, şapka, takı', how: 'Yüzün net görünsün' },
] as const;

export const GENERAL_TIPS = [
  'Önden dur, telefonu dik tut.',
  'Sade arka plan ve bol ışık.',
  'Denenecek bölgeyi çanta, el vb. kapatmasın.',
] as const;

/** Ürüne göre kadraj listesi; satırlar ince çizgilerle ayrılır. */
export function ShootingGuide() {
  return (
    <View style={styles.list} accessibilityRole="summary">
      {SHOOTING_GUIDE.map((row, index) => (
        <View key={row.what} style={[styles.row, index > 0 && styles.divider]}>
          <Text style={styles.icon}>{row.icon}</Text>
          <View style={styles.texts}>
            <Text style={typography.label}>{row.how}</Text>
            <Text style={typography.caption}>{row.what}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm + 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.frame },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  texts: { flex: 1, gap: 1 },
});
