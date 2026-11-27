import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { Garment } from '@/types/garment';
import { slotLabel } from '../garmentSlots';

type Props = {
  garments: Garment[];
};

/** Ekranın altındaki kombin özeti: seçili ürünler giydirme sırasıyla. */
export function OutfitBar({ garments }: Props) {
  if (garments.length === 0) {
    return <Text style={typography.caption}>Kombinin boş. Denemek istediğin ürünlere dokun.</Text>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={`Kombin: ${garments.map((g) => slotLabel(g.slot)).join(', ')}`}
    >
      {garments.map((garment) => (
        <View key={garment.id} style={styles.item}>
          <Image
            source={{ uri: garment.image.uri }}
            style={styles.thumb}
            resizeMode="contain"
            accessibilityLabel={`Kombindeki ${slotLabel(garment.slot)} ürünü`}
          />
          <Text style={styles.label} numberOfLines={1}>
            {slotLabel(garment.slot)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  item: { width: 56, alignItems: 'center', gap: 2 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  label: { color: colors.textMuted, fontSize: 11 },
});
