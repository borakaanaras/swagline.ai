import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  message: string;
  onDismiss: () => void;
};

/** Kombin kuralı uygulandığında (ör. elbise üst/altı çıkardığında) gösterilen kısa not. */
export function OutfitNotice({ message, onDismiss }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={message}
      accessibilityHint="Notu kapatır"
      onPress={onDismiss}
      style={styles.box}
    >
      <Text style={[typography.body, styles.text]}>{message}</Text>
      <Text style={styles.close}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSurface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  text: { flex: 1 },
  close: { color: colors.accent, fontSize: 20, fontWeight: '600' },
});
