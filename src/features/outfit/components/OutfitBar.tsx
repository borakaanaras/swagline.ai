import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';
import type { Garment } from '@/types/garment';
import { GARMENT_SLOT_LABELS } from '../slotLabels';

type Props = {
  selected: Garment[];
  notice: string | null;
  canTryOn: boolean;
  onTryOn: () => void;
};

/** Ekranın altına sabitlenen kombin çubuğu ve "Üzerimde dene" butonu. */
export function OutfitBar({ selected, notice, canTryOn, onTryOn }: Props) {
  return (
    <View style={styles.wrap}>
      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite" accessibilityRole="text">
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {selected.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {selected.map((garment) => (
            <View key={garment.id} style={styles.item}>
              <Image
                source={{ uri: garment.image.uri }}
                style={styles.thumb}
                resizeMode="cover"
                accessibilityLabel={`Kombindeki ${GARMENT_SLOT_LABELS[garment.slot]}`}
              />
              <Text style={styles.itemLabel} numberOfLines={1}>
                {GARMENT_SLOT_LABELS[garment.slot]}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <Button
        title={selected.length > 1 ? `Üzerimde dene (${selected.length} parça)` : 'Üzerimde dene'}
        onPress={onTryOn}
        disabled={!canTryOn}
        accessibilityHint="Seçili kombini fotoğrafının üzerine giydirir"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  notice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  noticeText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  row: { gap: spacing.sm },
  item: { width: 52, alignItems: 'center', gap: 3 },
  thumb: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.surface },
  itemLabel: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 11 },
});
