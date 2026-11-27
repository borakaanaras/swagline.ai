import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ImagePickerErrorState } from '@/components/ui';
import { pickImage } from '@/services/media/imagePickerService';
import {
  applyGarmentToOutfit,
  createGarmentId,
  getOutfitGarments,
  isInOutfit,
} from '@/store/outfitRules';
import { useTryOnSession } from '@/store/TryOnSessionContext';
import { MAX_GARMENTS, type Garment, type GarmentSlot } from '@/types/garment';
import type { ImageSource, LocalImage } from '@/types/image';
import { describeDisplacement } from '../outfitNotice';

/** Yuva seçici: yeni ürün eklerken veya mevcut ürünün kategorisini düzeltirken açılır. */
export type SlotPickerState =
  | { mode: 'add'; image: LocalImage }
  | { mode: 'edit'; garmentId: string; image: LocalImage; currentSlot: GarmentSlot }
  | null;

const NOTICE_DURATION_MS = 3500;

/**
 * Kombin ekranının akış mantığı: ürün ekleme (picker → yuva seçimi), havuz yönetimi,
 * kombine ekleme/çıkarma ve kombin kurallarından doğan bilgi notları.
 */
export function useOutfitBuilder() {
  const session = useTryOnSession();
  const { bodyPhoto, garments, outfit } = session;

  const [loadingSource, setLoadingSource] = useState<ImageSource | null>(null);
  const [error, setError] = useState<ImagePickerErrorState | null>(null);
  const [slotPicker, setSlotPicker] = useState<SlotPickerState>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const canAddMore = garments.length < MAX_GARMENTS;
  const selectedGarments = useMemo(() => getOutfitGarments(outfit, garments), [outfit, garments]);

  /** Ürün kombine girmeden önce kimlerin çıkacağını hesaplayıp notu gösterir. */
  const announce = useCallback(
    (garment: Garment) => {
      const { displacedIds } = applyGarmentToOutfit(outfit, garment);
      const displaced = garments.filter((g) => displacedIds.includes(g.id));
      setNotice(describeDisplacement(garment, displaced));
    },
    [outfit, garments],
  );

  const pick = useCallback(
    async (source: ImageSource) => {
      if (!canAddMore) return;
      setError(null);
      setLoadingSource(source);
      const result = await pickImage(source);
      setLoadingSource(null);

      switch (result.status) {
        case 'success':
          setSlotPicker({ mode: 'add', image: result.image });
          break;
        case 'permission-denied':
          setError({ kind: 'permission-denied', source, canAskAgain: result.canAskAgain });
          break;
        case 'error':
          setError({ kind: 'unknown', message: result.message });
          break;
        case 'cancelled':
          break;
      }
    },
    [canAddMore],
  );

  const selectSlot = (slot: GarmentSlot) => {
    if (!slotPicker) return;

    if (slotPicker.mode === 'add') {
      const garment: Garment = {
        id: createGarmentId(),
        image: slotPicker.image,
        slot,
        removeBackground: true,
      };
      announce(garment);
      session.addGarment(garment);
    } else {
      const existing = garments.find((g) => g.id === slotPicker.garmentId);
      if (existing && existing.slot !== slot) {
        if (isInOutfit(outfit, existing.id)) announce({ ...existing, slot });
        session.setGarmentSlot(existing.id, slot);
      }
    }
    setSlotPicker(null);
  };

  const editSlot = (garment: Garment) =>
    setSlotPicker({
      mode: 'edit',
      garmentId: garment.id,
      image: garment.image,
      currentSlot: garment.slot,
    });

  const toggleGarment = (garment: Garment) => {
    if (isInOutfit(outfit, garment.id)) {
      setNotice(null);
    } else {
      announce(garment);
    }
    session.toggleGarmentInOutfit(garment.id);
  };

  const retry = () => {
    if (error?.kind === 'permission-denied') return pick(error.source);
    setError(null);
  };

  return {
    bodyPhoto,
    garments,
    selectedGarments,
    isSelected: (garment: Garment) => isInOutfit(outfit, garment.id),
    canAddMore,
    loadingSource,
    error,
    retry,
    notice,
    slotPicker,
    takePhoto: () => pick('camera'),
    chooseFromLibrary: () => pick('library'),
    selectSlot,
    cancelSlotPicker: () => setSlotPicker(null),
    editSlot,
    toggleGarment,
    removeGarment: (garment: Garment) => session.removeGarment(garment.id),
    setRemoveBackground: (garment: Garment, value: boolean) =>
      session.setRemoveBackground(garment.id, value),
  };
}
