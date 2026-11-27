import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

const TIPS = [
  'Ürün fotoğrafta tek başına olsun.',
  'Ürünün tamamı görünsün, kenarlardan kesilmesin.',
  'Askıda ya da düz bir zeminde, net ve iyi ışıkta çek.',
  'Arka planı biz temizleriz; sade olması yine de işe yarar.',
];

export function ProductPhotoTips() {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={typography.subtitle}>Ürün fotoğrafı ipuçları</Text>
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
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  bullet: { color: colors.accent, fontSize: 15, lineHeight: 21 },
  tip: { flex: 1, lineHeight: 21 },
});
