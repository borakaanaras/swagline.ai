import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '@/theme';

type Props = {
  onPress: () => void;
  loading: boolean;
  /** Havuz boşken tam genişlikte, büyük gösterilir. */
  wide: boolean;
};

/** Izgaradaki "Ürün ekle" kutucuğu: kesikli çerçeve, boş bir askı yeri gibi. */
export function AddGarmentTile({ onPress, loading, wide }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ürün ekle"
      accessibilityHint="Kamerayla çek veya galeriden seç"
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.slot, wide ? styles.wide : styles.narrow, pressed && styles.pressed]}
    >
      <View style={[styles.tile, wide && styles.tileWide]}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
            <Text style={typography.label}>Ürün ekle</Text>
            {wide ? <Text style={typography.caption}>Kıyafet, ayakkabı, gözlük, aksesuar</Text> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {},
  narrow: { width: '48%' },
  wide: { width: '100%' },
  pressed: { opacity: 0.7 },
  tile: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.frame,
  },
  tileWide: { aspectRatio: undefined, paddingVertical: spacing.xl + spacing.md },
  plusCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { color: colors.primaryText, fontFamily: fonts.medium, fontSize: 26, lineHeight: 30 },
});
