import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

const TIPS = [
  'Baştan ayağa tüm vücudun kadrajda olsun.',
  'Telefonu bel hizasında, dik (portre) tut.',
  'Düz ve sade bir arka plan önünde dur.',
  'Önden, kollar hafif yana açık şekilde dur.',
  'Bol ışık olsun; arkandan gelen ışıktan kaçın.',
  'Vücut hatlarını gösteren, ince kıyafetler tercih et.',
];

export function FramingTips() {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={typography.subtitle}>İyi bir sonuç için</Text>
      {TIPS.map((tip) => (
        <View key={tip} style={styles.row}>
          <Text style={styles.bullet}>•</Text>
          <Text style={[typography.body, styles.tip]}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  bullet: { color: colors.primary, fontSize: 15, lineHeight: 21 },
  tip: { flex: 1, lineHeight: 21 },
});
