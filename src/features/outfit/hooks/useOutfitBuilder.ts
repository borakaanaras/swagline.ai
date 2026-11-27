import { useCallback, useMemo, useState } from 'react';

import { pickImage } from '@/services/media/imagePickerService';
import { applyGarmentToOutfit, isGarmentInOutfit } from '@/store/outfitRules';
import { useTryOnSession } from '@/store/TryOnSessionContext';
import { GARMENT_SLOT_ORDER, MAX_GARMENTS, type Garment, type GarmentSlot } from '@/types/garment';
import type { ImageSource, LocalImage } from '@/types/image';
import { GARMENT_SLOT_TEXT } from '../garmentSlots';

export type GarmentPickError =
  | { kind: 'permission-denied'; source: ImageSource; canAskAgain: boolean }
  | { kind: 'unknown'; message: string };

function createGarmentId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Bir ürün kombine girdiğinde kullanıcıya gösterilecek kısa bilgi notu (yoksa null). */
function noticeFor(
  garment: Pick<Garment, 'id' | 'slot'>,
  replacedSameSlot: boolean,
  removedSlots: GarmentSlot[],
): string | null {
  if (removedSlots.length > 0) {
    const [first, ...rest] = removedSlots;
    const removed = [GARMENT_SLOT_TEXT[first].label, ...rest.map((s) => GARMENT_SLOT_TEXT[s].noun)].join(' ve ');
    return `${removed}, ${GARMENT_SLOT_TEXT[garment.slot].noun} ile birlikte seçilemez; kombinden çıkarıldı.`;
  }
  if (replacedSameSlot) {
    return `${GARMENT_SLOT_TEXT[garment.slot].label} yuvasındaki önceki ürünün yerine geçti.`;
  }
  return null;
}

/**
 * Kombin ekranının akış mantığı: ürün fotoğrafı alma, yuva seçtirme,
 * havuz ve kombin işlemleri. Kombin kuralları `outfitRules` içindedir.
 */
export function useOutfitBuilder() {
  const session = useTryOnSession();
  const { garments, outfit, addGarment, toggleGarmentInOutfit } = session;

  const [loadingSource, setLoadingSource] = useState<ImageSource | null>(null);
  const [error, setError] = useState<GarmentPickError | null>(null);
  /** Fotoğrafı alınmış, kategorisi henüz seçilmemiş ürün. */
  const [pendingImage, setPendingImage] = useState<LocalImage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isFull = garments.length >= MAX_GARMENTS;

  const pickProduct = useCallback(
    async (source: ImageSource) => {
      if (isFull) return;
      setError(null);
      setNotice(null);
      setLoadingSource(source);
      const result = await pickImage(source);
      setLoadingSource(null);

      switch (result.status) {
        case 'success':
          setPendingImage(result.image);
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
    [isFull],
  );

  const confirmSlot = useCallback(
    (slot: GarmentSlot) => {
      if (!pendingImage) return;
      const garment: Garment = { id: createGarmentId(), image: pendingImage, slot, removeBackground: true };
      const { removedSlots } = applyGarmentToOutfit(outfit, garment);
      setNotice(noticeFor(garment, outfit[slot] !== undefined, removedSlots));
      addGarment(garment);
      setPendingImage(null);
    },
    [pendingImage, outfit, addGarment],
  );

  const toggleInOutfit = useCallback(
    (garmentId: string) => {
      const garment = garments.find((g) => g.id === garmentId);
      if (!garment) return;
      if (isGarmentInOutfit(outfit, garmentId)) {
        setNotice(null);
      } else {
        const { removedSlots } = applyGarmentToOutfit(outfit, garment);
        setNotice(noticeFor(garment, outfit[garment.slot] !== undefined, removedSlots));
      }
      toggleGarmentInOutfit(garmentId);
    },
    [garments, outfit, toggleGarmentInOutfit],
  );

  /** Kombindeki ürünler, giydirme sırasıyla. */
  const selectedGarments = useMemo(
    () =>
      GARMENT_SLOT_ORDER.flatMap((slot) => {
        const garment = garments.find((g) => g.id === outfit[slot]);
        return garment ? [garment] : [];
      }),
    [garments, outfit],
  );

  return {
    bodyPhoto: session.bodyPhoto,
    garments,
    outfit,
    selectedGarments,
    isFull,
    loadingSource,
    error,
    pendingImage,
    notice,
    takeProductPhoto: () => pickProduct('camera'),
    chooseProductFromLibrary: () => pickProduct('library'),
    retryAfterError: () => (error?.kind === 'permission-denied' ? pickProduct(error.source) : setError(null)),
    confirmSlot,
    cancelSlot: () => setPendingImage(null),
    toggleInOutfit,
    removeGarment: (garmentId: string) => {
      setNotice(null);
      session.removeGarment(garmentId);
    },
    setRemoveBackground: session.setGarmentRemoveBackground,
    dismissNotice: () => setNotice(null),
  };
}
