import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = { current: number; total: number };

/** Akıştaki adımı gösteren ince bölümlü çubuk (metin etiketi yerine). */
export function StepIndicator({ current, total }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Adım ${current} / ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.done]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, width: 56 },
  segment: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  done: { backgroundColor: colors.text },
});
