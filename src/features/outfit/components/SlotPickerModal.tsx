import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { GARMENT_SLOTS, type GarmentSlot } from '@/types/garment';
import type { SlotPickerState } from '../hooks/useOutfitBuilder';
import { GARMENT_SLOT_EXAMPLES, GARMENT_SLOT_LABELS } from '../slotLabels';

type Props = {
  state: SlotPickerState;
  onSelect: (slot: GarmentSlot) => void;
  onCancel: () => void;
};

/** Alttan açılan yuva (kategori) seçici. */
export function SlotPickerModal({ state, onSelect, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const currentSlot = state?.mode === 'edit' ? state.currentSlot : null;

  return (
    <Modal visible={state !== null} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.header}>
            {state ? (
              <Image
                source={{ uri: state.image.uri }}
                style={styles.thumb}
                resizeMode="cover"
                accessibilityLabel="Seçilen ürün fotoğrafı"
              />
            ) : null}
            <Text style={[typography.title, styles.headerTitle]}>
              {state?.mode === 'edit' ? 'Kategoriyi değiştir' : 'Bu ürün ne?'}
            </Text>
          </View>

          <View style={styles.grid}>
            {GARMENT_SLOTS.map((slot) => {
              const active = slot === currentSlot;
              return (
                <Pressable
                  key={slot}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={GARMENT_SLOT_LABELS[slot]}
                  accessibilityHint={GARMENT_SLOT_EXAMPLES[slot]}
                  onPress={() => onSelect(slot)}
                  style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
                >
                  <Text style={styles.optionLabel}>{GARMENT_SLOT_LABELS[slot]}</Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {GARMENT_SLOT_EXAMPLES[slot]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button title="Vazgeç" variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    borderTopWidth: 1,
    borderColor: colors.frame,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 42, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  headerTitle: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  option: {
    width: '48.5%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 2,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  optionLabel: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  pressed: { opacity: 0.75 },
});
