import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ImagePickerError, Screen, StepIndicator } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';
import { BodyPhotoPreview } from '../components/BodyPhotoPreview';
import { ShootingGuideModal } from '../components/ShootingGuideModal';
import { useBodyPhotoPicker } from '../hooks/useBodyPhotoPicker';

export function BodyPhotoScreen() {
  const { bodyPhoto, loadingSource, error, takePhoto, chooseFromLibrary, dismissError } =
    useBodyPhotoPicker();

  const [guideOpen, setGuideOpen] = useState(false);
  const busy = loadingSource !== null;
  const hasPhoto = bodyPhoto !== null;
  const retry = () => {
    if (error?.kind === 'permission-denied' && error.source === 'camera') return takePhoto();
    if (error?.kind === 'permission-denied') return chooseFromLibrary();
    dismissError();
  };

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                title={hasPhoto ? 'Yeniden çek' : 'Fotoğraf çek'}
                variant={hasPhoto ? 'secondary' : 'primary'}
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
          {hasPhoto ? (
            <Button
              title="Devam et"
              disabled={busy}
              onPress={() => router.push('/capture/garment')}
              accessibilityHint="Kombin oluşturma adımına geçer"
            />
          ) : null}
        </>
      }
    >
      <View style={styles.topRow}>
        <StepIndicator current={1} total={2} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nasıl çekmeliyim?"
          onPress={() => setGuideOpen(true)}
          hitSlop={8}
          style={({ pressed }) => [styles.guideLink, pressed && styles.pressed]}
        >
          <Text style={styles.guideLinkText}>Nasıl çekmeliyim?</Text>
        </Pressable>
      </View>
      <Text style={typography.title}>Fotoğrafın</Text>

      <BodyPhotoPreview photo={bodyPhoto} />

      {error ? <ImagePickerError error={error} onRetry={retry} /> : null}

      <ShootingGuideModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideLink: { paddingVertical: spacing.xs },
  guideLinkText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
