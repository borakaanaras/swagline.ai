import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, radius, spacing, typography } from '@/theme';
import type { ImageSource } from '@/types/image';

/** Kamera/galeri akışlarında UI'a gösterilen hata durumu. */
export type ImagePickerErrorState =
  | { kind: 'permission-denied'; source: ImageSource; canAskAgain: boolean }
  | { kind: 'unknown'; message: string };

type Props = {
  error: ImagePickerErrorState;
  onRetry: () => void;
};

function messageFor(error: ImagePickerErrorState): string {
  if (error.kind === 'unknown') {
    return 'Fotoğraf alınırken bir sorun oluştu. Lütfen tekrar dene.';
  }
  const target = error.source === 'camera' ? 'kameraya' : 'fotoğraflarına';
  return error.canAskAgain
    ? `Devam etmek için ${target} erişim izni vermen gerekiyor.`
    : `${target[0].toUpperCase()}${target.slice(1)} erişim izni kapalı. Ayarlar'dan SwaglineAI için izni açabilirsin.`;
}

export function ImagePickerError({ error, onRetry }: Props) {
  const showSettings = error.kind === 'permission-denied' && !error.canAskAgain;

  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={typography.body}>{messageFor(error)}</Text>
      {showSettings ? (
        <Button title="Ayarları aç" variant="secondary" onPress={() => Linking.openSettings()} />
      ) : (
        <Button title="Tekrar dene" variant="secondary" onPress={onRetry} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
});
