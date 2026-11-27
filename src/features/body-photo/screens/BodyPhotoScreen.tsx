import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { spacing, typography } from '@/theme';
import { BodyPhotoError } from '../components/BodyPhotoError';
import { BodyPhotoPreview } from '../components/BodyPhotoPreview';
import { FramingTips } from '../components/FramingTips';
import { useBodyPhotoPicker } from '../hooks/useBodyPhotoPicker';

export function BodyPhotoScreen() {
  const { bodyPhoto, loadingSource, error, takePhoto, chooseFromLibrary, dismissError } =
    useBodyPhotoPicker();

  const busy = loadingSource !== null;
  const retry = () => {
    if (error?.kind === 'permission-denied' && error.source === 'camera') return takePhoto();
    if (error?.kind === 'permission-denied') return chooseFromLibrary();
    dismissError();
  };

  return (
    <Screen
      footer={
        <Button
          title="Devam et"
          disabled={!bodyPhoto || busy}
          onPress={() => router.push('/capture/garment')}
          accessibilityHint="Ürün fotoğrafı seçme adımına geçer"
        />
      }
    >
      <Text style={typography.caption}>Adım 1 / 2</Text>
      <Text style={typography.title}>Tam boy fotoğrafın</Text>
      <Text style={[typography.body, styles.muted]}>
        Kıyafetleri senin üzerinde göstermek için baştan ayağa bir fotoğrafına ihtiyacımız var.
      </Text>

      <BodyPhotoPreview photo={bodyPhoto} />

      {error ? <BodyPhotoError error={error} onRetry={retry} /> : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            title={bodyPhoto ? 'Yeniden çek' : 'Fotoğraf çek'}
            onPress={takePhoto}
            loading={loadingSource === 'camera'}
            disabled={busy}
          />
        </View>
        <View style={styles.action}>
          <Button
            title="Galeriden seç"
            variant="secondary"
            onPress={chooseFromLibrary}
            loading={loadingSource === 'library'}
            disabled={busy}
          />
        </View>
      </View>

      <FramingTips />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.75 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
