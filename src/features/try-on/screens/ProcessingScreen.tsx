import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, BackHandler, Image, StyleSheet, Text, View } from 'react-native';

import { Button, Mirror, ScanLine, Screen } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';
import { ProgressBar } from '../components/ProgressBar';
import { useTryOnJob } from '../hooks/useTryOnJob';
import {
  describeTryOnError,
  ERROR_ACTION_LABELS,
  estimateText,
  phaseStep,
  phaseTitle,
  progressFraction,
  type TryOnErrorAction,
} from '../tryOnCopy';

const LONG_WAIT_SECONDS_PER_GARMENT = 30;

function goBackToOutfit() {
  if (router.canGoBack()) router.back();
  else router.replace('/capture/garment');
}

export function ProcessingScreen() {
  const { state, garmentCount, bodyPhotoUri, cancel, retry } = useTryOnJob({
    onSuccess: () => router.replace('/result'),
  });

  const confirmCancel = useCallback(() => {
    Alert.alert('Denemeyi iptal et?', undefined, [
      { text: 'Devam et', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: () => {
          cancel();
          goBackToOutfit();
        },
      },
    ]);
  }, [cancel]);

  // Android geri tuşu: iş sürerken onay iste.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (state.kind !== 'running') return false;
      confirmCancel();
      return true;
    });
    return () => sub.remove();
  }, [state.kind, confirmCancel]);

  if (state.kind === 'missing-input') {
    return (
      <Screen scroll={false} footer={<Button title="Kombine dön" onPress={goBackToOutfit} />}>
        <View style={styles.center}>
          <Text style={typography.title}>Kombin bulunamadı</Text>
        </View>
      </Screen>
    );
  }

  if (state.kind === 'error') {
    const copy = describeTryOnError(state.error);
    const runAction = (action: TryOnErrorAction) => {
      if (action === 'retry') retry();
      else if (action === 'change-body') router.dismissTo('/capture/body');
      else goBackToOutfit();
    };
    return (
      <Screen
        scroll={false}
        footer={
          <>
            <Button title={ERROR_ACTION_LABELS[copy.action]} onPress={() => runAction(copy.action)} />
            {copy.action !== 'back' ? (
              <Button title="Kombine dön" variant="secondary" onPress={goBackToOutfit} />
            ) : null}
          </>
        }
      >
        <View style={styles.errorBody} accessibilityRole="alert">
          <View style={styles.errorMark}>
            <Text style={styles.errorMarkText}>!</Text>
          </View>
          <Text style={typography.display}>{copy.title}</Text>
          <Text style={[typography.body, styles.muted]}>{copy.message}</Text>
        </View>
      </Screen>
    );
  }

  const { progress, elapsedSeconds } = state;
  const step = phaseStep(progress);
  const isLong = elapsedSeconds > LONG_WAIT_SECONDS_PER_GARMENT * garmentCount;

  return (
    <Screen scroll={false} footer={<Button title="İptal et" variant="secondary" onPress={confirmCancel} />}>
      <Mirror style={styles.mirror}>
        {bodyPhotoUri ? (
          <Image
            source={{ uri: bodyPhotoUri }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityLabel="Giydirilen fotoğrafın"
          />
        ) : null}
        <View style={styles.dim} />
        <ScanLine loop duration={2600} />
      </Mirror>

      <View style={styles.status} accessibilityLiveRegion="polite">
        <View style={styles.titleRow}>
          <Text style={[typography.title, styles.phase]}>{phaseTitle(progress)}</Text>
          {step ? <Text style={styles.step}>{step}</Text> : null}
        </View>
        <ProgressBar value={progressFraction(progress)} />
        <Text style={typography.caption}>
          {isLong ? 'Biraz uzun sürüyor, bekliyoruz…' : estimateText(garmentCount)}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mirror: { flex: 1, width: '82%', alignSelf: 'center' },
  photo: { ...StyleSheet.absoluteFill },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay, opacity: 0.55 },
  status: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  phase: { flex: 1 },
  step: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 16 },
  muted: { color: colors.textMuted },
  errorBody: { flex: 1, justifyContent: 'flex-end', gap: spacing.md, paddingBottom: spacing.lg },
  errorMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMarkText: { color: colors.danger, fontFamily: fonts.extrabold, fontSize: 26 },
});
