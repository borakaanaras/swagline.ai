import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';
import { MAX_GARMENTS } from '@/types/garment';
import { BodyPhotoSummary } from '../components/BodyPhotoSummary';
import { GarmentCard } from '../components/GarmentCard';
import { GarmentPickErrorBox } from '../components/GarmentPickErrorBox';
import { OutfitBar } from '../components/OutfitBar';
import { OutfitNotice } from '../components/OutfitNotice';
import { ProductPhotoTips } from '../components/ProductPhotoTips';
import { SlotPickerModal } from '../components/SlotPickerModal';
import { useOutfitBuilder } from '../hooks/useOutfitBuilder';

export function OutfitScreen() {
  const {
    bodyPhoto,
    garments,
    selectedGarments,
    isFull,
    loadingSource,
    error,
    pendingImage,
    notice,
    takeProductPhoto,
    chooseProductFromLibrary,
    retryAfterError,
    confirmSlot,
    cancelSlot,
    toggleInOutfit,
    removeGarment,
    setRemoveBackground,
    dismissNotice,
  } = useOutfitBuilder();

  const busy = loadingSource !== null;
  const selectedIds = new Set(selectedGarments.map((g) => g.id));
  const canTryOn = bodyPhoto !== null && selectedGarments.length > 0;

  return (
    <Screen
      footer={
        <>
          <OutfitBar garments={selectedGarments} />
          <Button
            title={selectedGarments.length > 1 ? `Üzerimde dene (${selectedGarments.length} parça)` : 'Üzerimde dene'}
            disabled={!canTryOn || busy}
            onPress={() => router.push('/processing')}
            accessibilityHint="Seçili kombini boy fotoğrafının üzerinde dener"
          />
        </>
      }
    >
      <Text style={typography.caption}>Adım 2 / 2</Text>
      <Text style={typography.title}>Kombinini oluştur</Text>
      <Text style={[typography.body, styles.muted]}>
        Denemek istediğin ürünlerin fotoğraflarını ekle. Birden fazla parçayı aynı anda deneyebilirsin.
      </Text>

      <BodyPhotoSummary photo={bodyPhoto} onChange={() => router.dismissTo('/capture/body')} />

      {error ? <GarmentPickErrorBox error={error} onRetry={retryAfterError} /> : null}
      {notice ? <OutfitNotice message={notice} onDismiss={dismissNotice} /> : null}

      <View style={styles.sectionHeader}>
        <Text style={typography.subtitle}>Ürünler</Text>
        <Text style={typography.caption}>
          {garments.length} / {MAX_GARMENTS}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            title="Fotoğraf çek"
            onPress={takeProductPhoto}
            loading={loadingSource === 'camera'}
            disabled={busy || isFull}
            accessibilityHint="Kamerayla ürün fotoğrafı çeker"
          />
        </View>
        <View style={styles.action}>
          <Button
            title="Galeriden seç"
            variant="secondary"
            onPress={chooseProductFromLibrary}
            loading={loadingSource === 'library'}
            disabled={busy || isFull}
            accessibilityHint="Galeriden ürün fotoğrafı seçer"
          />
        </View>
      </View>
      {isFull ? (
        <Text style={typography.caption}>
          En fazla {MAX_GARMENTS} ürün ekleyebilirsin. Yenisi için birini sil.
        </Text>
      ) : null}

      {garments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.body, styles.emptyText]}>Henüz ürün eklemedin.</Text>
          <Text style={[typography.caption, styles.emptyText]}>
            Üst, alt, elbise, dış giyim, ayakkabı, gözlük ya da aksesuar ekleyebilirsin.
          </Text>
        </View>
      ) : (
        <>
          <Text style={typography.caption}>Kombine eklemek ya da çıkarmak için ürüne dokun.</Text>
          <View style={styles.grid}>
            {garments.map((garment) => (
              <GarmentCard
                key={garment.id}
                garment={garment}
                selected={selectedIds.has(garment.id)}
                onToggle={() => toggleInOutfit(garment.id)}
                onRemove={() => removeGarment(garment.id)}
                onToggleBackground={() => setRemoveBackground(garment.id, !garment.removeBackground)}
              />
            ))}
          </View>
        </>
      )}

      <ProductPhotoTips />

      <SlotPickerModal image={pendingImage} onSelect={confirmSlot} onCancel={cancelSlot} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.75 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyText: { textAlign: 'center' },
});
