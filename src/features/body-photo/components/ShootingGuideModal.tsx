import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { GENERAL_TIPS, ShootingGuide } from './ShootingGuide';

type Props = { visible: boolean; onClose: () => void };

/** "Nasıl çekmeliyim?" rehberi: ürüne göre kadraj + genel ipuçları. */
export function ShootingGuideModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={typography.title}>Nasıl çekmeliyim?</Text>
          <Text style={[typography.body, styles.muted]}>Ne deneyeceksen o bölge net görünsün.</Text>
          <ShootingGuide />
          <View style={styles.tips}>
            {GENERAL_TIPS.map((tip) => (
              <Text key={tip} style={[typography.body, styles.muted]}>
                {tip}
              </Text>
            ))}
          </View>
          <Button title="Anladım" onPress={onClose} />
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
  tips: { gap: spacing.xs },
  muted: { color: colors.textMuted },
});
