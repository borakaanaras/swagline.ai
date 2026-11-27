import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { Garment } from '@/types/garment';
import { slotLabel } from '../garmentSlots';

type Props = {
  garment: Garment;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onToggleBackground: () => void;
};

/** Ürün havuzundaki tek kart: dokununca kombine ekler/çıkarır. */
export function GarmentCard({ garment, selected, onToggle, onRemove, onToggleBackground }: Props) {
  const label = slotLabel(garment.slot);

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label} ürünü`}
        accessibilityHint={selected ? 'Kombinden çıkarır' : 'Kombine ekler'}
        onPress={onToggle}
        style={({ pressed }) => [styles.imageWrap, pressed && styles.pressed]}
      >
        <Image
          source={{ uri: garment.image.uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={`${label} ürün fotoğrafı`}
        />
        <View style={styles.slotChip}>
          <Text style={styles.slotChipText}>{label}</Text>
        </View>
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ürününü sil`}
        onPress={onRemove}
        hitSlop={spacing.sm}
        style={styles.remove}
      >
        <Text style={styles.removeText}>×</Text>
      </Pressable>

      <View style={styles.footer}>
        {garment.removeBackground ? (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✦ Arka plan temizlenecek</Text>
          </View>
        ) : (
          <Text style={typography.caption}>Orijinal kullanılacak</Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={onToggleBackground}
          hitSlop={spacing.xs}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.link}>{garment.removeBackground ? 'Orijinali kullan' : 'Arka planı temizle'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  image: { width: '100%', height: '100%' },
  pressed: { opacity: 0.7 },
  slotChip: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  slotChipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  check: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  checkText: { color: colors.primaryText, fontSize: 14, fontWeight: '700' },
  remove: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  removeText: { color: colors.text, fontSize: 18, lineHeight: 20, fontWeight: '600' },
  footer: { padding: spacing.sm, gap: spacing.xs },
  aiBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSurface,
  },
  aiBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
