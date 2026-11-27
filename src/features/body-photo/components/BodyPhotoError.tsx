import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import type { BodyPhotoError as BodyPhotoErrorType } from '../hooks/useBodyPhotoPicker';

type Props = {
  error: BodyPhotoErrorType;
  onRetry: () => void;
};

function messageFor(error: BodyPhotoErrorType): string {
  if (error.kind === 'unknown') {
    return 'Fotoğraf alınırken bir sorun oluştu. Lütfen tekrar dene.';
  }
  const target = error.source === 'camera' ? 'kameraya' : 'fotoğraflarına';
  return error.canAskAgain
    ? `Devam etmek için ${target} erişim izni vermen gerekiyor.`
    : `${target[0].toUpperCase()}${target.slice(1)} erişim izni kapalı. Ayarlar'dan SwaglineAI için izni açabilirsin.`;
}

export function BodyPhotoError({ error, onRetry }: Props) {
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
