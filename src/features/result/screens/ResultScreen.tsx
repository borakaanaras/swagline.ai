import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { Button, Mirror, Screen } from '@/components/ui';
import { GARMENT_SLOT_LABELS } from '@/features/outfit';
import { useTryOnSession } from '@/store/TryOnSessionContext';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { WatermarkedImage } from '../components/WatermarkedImage';
import { useSaveResult } from '../hooks/useSaveResult';

type ResultView = 'after' | 'before';

/** İndirilen görselin uzun kenarı (piksel). */
const EXPORT_MAX_LONG_EDGE_PX = 1536;

function goBackToOutfit() {
  if (router.canGoBack()) router.back();
  else router.replace('/capture/garment');
}

function fitInside(box: { width: number; height: number }, aspect: number) {
  if (box.width / box.height > aspect) return { width: box.height * aspect, height: box.height };
  return { width: box.width, height: box.width / aspect };
}

export function ResultScreen() {
  const { result } = useTryOnSession();
  const [view, setView] = useState<ResultView>('after');
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const saver = useSaveResult();
  const { state: saveState, reset: resetSave } = saver;

  useEffect(() => {
    if (saveState.kind === 'permission-denied') {
      Alert.alert(
        'Fotoğraflar izni gerekli',
        "Görseli kaydedebilmek için Fotoğraflar'a ekleme izni ver.",
        saveState.canAskAgain
          ? [{ text: 'Tamam', onPress: resetSave }]
          : [
              { text: 'Vazgeç', style: 'cancel', onPress: resetSave },
              {
                text: 'Ayarları aç',
                onPress: () => {
                  resetSave();
                  Linking.openSettings();
                },
              },
            ],
      );
    } else if (saveState.kind === 'error') {
      Alert.alert('Kaydedilemedi', 'Görsel kaydedilirken bir sorun oluştu. Lütfen tekrar dene.', [
        { text: 'Tamam', onPress: resetSave },
      ]);
    }
  }, [saveState, resetSave]);

  if (!result) {
    return (
      <Screen scroll={false} footer={<Button title="Kombine dön" onPress={goBackToOutfit} />}>
        <View style={styles.missing}>
          <Text style={typography.subtitle}>Henüz sonuç yok</Text>
        </View>
      </Screen>
    );
  }

  const aspect = result.width > 0 && result.height > 0 ? result.width / result.height : 3 / 4;
  const shown = frame ? fitInside(frame, aspect) : null;
  const isAfter = view === 'after';

  // Dışa aktarma görünümü dp cinsinden; yakalanınca dp × PixelRatio piksel olur.
  const exportScale = Math.min(1, EXPORT_MAX_LONG_EDGE_PX / Math.max(result.width, result.height, 1));
  const exportDp = {
    width: (result.width * exportScale) / PixelRatio.get(),
    height: (result.height * exportScale) / PixelRatio.get(),
  };

  const failedLabels = result.failedGarments.map((g) => GARMENT_SLOT_LABELS[g.slot]).join(', ');

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button
            title={saveState.kind === 'saved' ? 'Kaydedildi ✓' : 'Görseli indir'}
            onPress={saver.save}
            loading={saveState.kind === 'saving'}
            disabled={saveState.kind === 'saved'}
            accessibilityHint="Logolu sonucu Fotoğraflar'a kaydeder"
          />
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Kombini değiştir" variant="secondary" onPress={goBackToOutfit} />
            </View>
            <View style={styles.action}>
              <Button title="Tekrar dene" variant="secondary" onPress={() => router.replace('/processing')} />
            </View>
          </View>
        </>
      }
    >
      <View style={styles.toggle} accessibilityRole="tablist">
        {(['before', 'after'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === option }}
            onPress={() => setView(option)}
            style={[styles.toggleItem, view === option && styles.toggleItemActive]}
          >
            <Text style={[styles.toggleText, view === option && styles.toggleTextActive]}>
              {option === 'before' ? 'Önce' : 'Sonra'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Mirror style={styles.mirror}>
        <View
          style={styles.glass}
          onLayout={(e: LayoutChangeEvent) =>
            setFrame({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
          }
        >
          {shown ? (
            // iOS'ta iki parmakla yakınlaştırılabilir.
            <ScrollView
              style={styles.zoom}
              contentContainerStyle={styles.zoomContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent
            >
              <WatermarkedImage
                uri={isAfter ? result.imageUri : result.bodyPhotoUri}
                width={shown.width}
                height={shown.height}
                watermark={isAfter}
                accessibilityLabel={isAfter ? 'Kıyafetler giydirilmiş sonuç' : 'Orijinal fotoğrafın'}
              />
            </ScrollView>
          ) : null}
        </View>
      </Mirror>

      <View style={styles.garments}>
        {result.appliedGarments.map((garment) => (
          <Image
            key={garment.id}
            source={{ uri: garment.image.uri }}
            style={styles.thumb}
            resizeMode="cover"
            accessibilityLabel={GARMENT_SLOT_LABELS[garment.slot]}
          />
        ))}
      </View>

      {failedLabels ? (
        <Text style={[typography.caption, styles.warning]}>{failedLabels} giydirilemedi.</Text>
      ) : null}
      <Text style={[typography.caption, styles.disclaimer, result.isDemo && styles.demoText]}>
        {result.isDemo
          ? 'Demo sonuç: AI henüz bağlı değil.'
          : 'AI tarafından üretildi; gerçek beden ve kalıp farklı olabilir.'}
      </Text>

      {/* Ekran dışında, tam çözünürlükte logolu kopya: "Görseli indir" bunu yakalar. */}
      <View
        style={styles.offscreen}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <WatermarkedImage
          ref={saver.exportRef}
          uri={result.imageUri}
          width={exportDp.width}
          height={exportDp.height}
          watermark
          accessibilityLabel=""
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mirror: { flex: 1 },
  glass: { flex: 1 },
  zoom: { flex: 1 },
  zoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  toggle: {
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.frame,
  },
  toggleItem: { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: radius.pill },
  toggleItemActive: { backgroundColor: colors.text },
  toggleText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  toggleTextActive: { color: colors.background },
  demoText: { color: colors.accent },
  garments: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  thumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  warning: { color: colors.danger, textAlign: 'center' },
  disclaimer: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
