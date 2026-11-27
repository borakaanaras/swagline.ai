import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';
import type { GarmentSlot } from '@/types/garment';
import type { LocalImage } from '@/types/image';
import { GARMENT_SLOT_TEXT } from '../garmentSlots';

/** Seçicide gösterim sırası (SPEC.md tablosuyla aynı). */
const PICKER_ORDER: readonly GarmentSlot[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'eyewear', 'accessory'];

type Props = {
  image: LocalImage | null;
  onSelect: (slot: GarmentSlot) => void;
  onCancel: () => void;
};

/** Yeni eklenen ürünün kategorisini (yuvasını) soran alt sayfa. */
export function SlotPickerModal({ image, onSelect, onCancel }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={image !== null} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTouch}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Vazgeç"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.header}>
            {image ? (
              <Image
                source={{ uri: image.uri }}
                style={styles.thumb}
                resizeMode="contain"
                accessibilityLabel="Eklenen ürünün fotoğrafı"
              />
            ) : null}
            <View style={styles.headerTexts}>
              <Text style={typography.subtitle}>Bu ürün ne?</Text>
              <Text style={typography.caption}>Doğru kategori, ürünün doğru yere giydirilmesini sağlar.</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.options}>
            {PICKER_ORDER.map((slot) => (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityLabel={GARMENT_SLOT_TEXT[slot].label}
                accessibilityHint={GARMENT_SLOT_TEXT[slot].examples}
                onPress={() => onSelect(slot)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <Text style={styles.optionLabel}>{GARMENT_SLOT_TEXT[slot].label}</Text>
                <Text style={typography.caption}>{GARMENT_SLOT_TEXT[slot].examples}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
          >
            <Text style={styles.cancelText}>Vazgeç</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  backdropTouch: { flex: 1 },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  headerTexts: { flex: 1, gap: spacing.xs },
  options: { gap: spacing.sm },
  option: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  optionPressed: { opacity: 0.7 },
  optionLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cancel: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});
