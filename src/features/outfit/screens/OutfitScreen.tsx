import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ImagePickerError, Screen, StepIndicator } from '@/components/ui';
import { spacing, typography } from '@/theme';
import { MAX_GARMENTS } from '@/types/garment';
import { AddGarmentTile } from '../components/AddGarmentTile';
import { BodyPhotoSummary } from '../components/BodyPhotoSummary';
import { GarmentCard } from '../components/GarmentCard';
import { OutfitBar } from '../components/OutfitBar';
import { SlotPickerModal } from '../components/SlotPickerModal';
import { useOutfitBuilder } from '../hooks/useOutfitBuilder';

export function OutfitScreen() {
  const builder = useOutfitBuilder();
  const { bodyPhoto, garments, selectedGarments, loadingSource, canAddMore } = builder;

  const changeBodyPhoto = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/capture/body');
  };

  const askSource = () =>
    Alert.alert('Ürün ekle', undefined, [
      { text: 'Fotoğraf çek', onPress: builder.takePhoto },
      { text: 'Galeriden seç', onPress: builder.chooseFromLibrary },
      { text: 'Vazgeç', style: 'cancel' },
    ]);

  return (
    <>
      <Screen
        footer={
          <OutfitBar
            selected={selectedGarments}
            notice={builder.notice}
            canTryOn={bodyPhoto !== null && selectedGarments.length > 0}
            onTryOn={() => router.push('/processing')}
          />
        }
      >
        <StepIndicator current={2} total={2} />
        <Text style={typography.title}>Kombinin</Text>

        <BodyPhotoSummary photo={bodyPhoto} onChange={changeBodyPhoto} />

        {builder.error ? <ImagePickerError error={builder.error} onRetry={builder.retry} /> : null}

        {garments.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Text style={typography.subtitle}>Ürünlerin</Text>
            <Text style={typography.caption}>
              {garments.length} / {MAX_GARMENTS}
            </Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {garments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              selected={builder.isSelected(garment)}
              onToggle={() => builder.toggleGarment(garment)}
              onRemove={() => builder.removeGarment(garment)}
              onEditSlot={() => builder.editSlot(garment)}
              onToggleBackground={() => builder.setRemoveBackground(garment, !garment.removeBackground)}
            />
          ))}
          {canAddMore ? (
            <AddGarmentTile onPress={askSource} loading={loadingSource !== null} wide={garments.length === 0} />
          ) : null}
        </View>
      </Screen>

      <SlotPickerModal
        state={builder.slotPicker}
        onSelect={builder.selectSlot}
        onCancel={builder.cancelSlotPicker}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
});
