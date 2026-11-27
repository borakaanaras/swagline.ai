import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { Garment } from '@/types/garment';
import { GARMENT_SLOT_LABELS } from '../slotLabels';

type Props = {
  garment: Garment;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onEditSlot: () => void;
  onToggleBackground: () => void;
};

/**
 * Ürün havuzundaki tek kart: dokununca kombine girer/çıkar.
 * Seçili kart indigo halkayla belirtilir; kartlar sakin kalır, gölge veya çerçeve yok.
 */
export function GarmentCard({ garment, selected, onToggle, onRemove, onEditSlot, onToggleBackground }: Props) {
  const slotLabel = GARMENT_SLOT_LABELS[garment.slot];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${slotLabel} ürünü`}
      accessibilityHint={selected ? 'Kombinden çıkarır' : 'Kombine ekler'}
      onPress={onToggle}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, selected && styles.imageWrapSelected]}>
        <Image
          source={{ uri: garment.image.uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={`${slotLabel} ürün fotoğrafı`}
        />
        {selected ? (
          <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no">
            <Text style={styles.checkText}>✓</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${slotLabel} ürününü sil`}
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: garment.removeBackground }}
          accessibilityLabel="Arka planı otomatik temizle"
          onPress={onToggleBackground}
          hitSlop={4}
          style={({ pressed }) => [
            styles.bgBadge,
            garment.removeBackground ? styles.bgOn : styles.bgOff,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.bgText, garment.removeBackground ? styles.bgTextOn : styles.bgTextOff]}>
            {garment.removeBackground ? '✦ Arka plan silinecek' : 'Orijinal'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Kategori: ${slotLabel}`}
        accessibilityHint="Kategoriyi değiştir"
        onPress={onEditSlot}
        hitSlop={6}
        style={({ pressed }) => [styles.slotRow, pressed && styles.pressed]}
      >
        <Text style={typography.label} numberOfLines={1}>
          {slotLabel}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', gap: spacing.sm },
  pressed: { opacity: 0.75 },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageWrapSelected: { borderColor: colors.primary },
  image: { width: '100%', height: '100%' },
  check: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: 14 },
  remove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: colors.text, fontFamily: fonts.medium, fontSize: 20, lineHeight: 22 },
  bgBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  bgOn: { backgroundColor: colors.accentSurface },
  bgOff: { backgroundColor: colors.overlay },
  bgText: { fontFamily: fonts.semibold, fontSize: 11 },
  bgTextOn: { color: colors.accent },
  bgTextOff: { color: colors.textMuted },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 2 },
  chevron: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, marginTop: -6 },
});
