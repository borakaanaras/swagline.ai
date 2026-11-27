import { useCallback, useState } from 'react';

import type { ImagePickerErrorState } from '@/components/ui';
import { pickImage } from '@/services/media/imagePickerService';
import { useTryOnSession } from '@/store/TryOnSessionContext';
import type { ImageSource } from '@/types/image';

export type BodyPhotoError = ImagePickerErrorState;

/**
 * Boy fotoğrafı seçme/çekme akışını yöneten hook.
 * Servisi çağırır, sonucu oturuma yazar ve UI için yüklenme/hata durumu verir.
 */
export function useBodyPhotoPicker() {
  const { bodyPhoto, setBodyPhoto, clearBodyPhoto } = useTryOnSession();
  const [loadingSource, setLoadingSource] = useState<ImageSource | null>(null);
  const [error, setError] = useState<BodyPhotoError | null>(null);

  const pick = useCallback(
    async (source: ImageSource) => {
      setError(null);
      setLoadingSource(source);
      const result = await pickImage(source);
      setLoadingSource(null);

      switch (result.status) {
        case 'success':
          setBodyPhoto(result.image);
          break;
        case 'permission-denied':
          setError({ kind: 'permission-denied', source, canAskAgain: result.canAskAgain });
          break;
        case 'error':
          setError({ kind: 'unknown', message: result.message });
          break;
        case 'cancelled':
          // Kullanıcı vazgeçti: mevcut fotoğraf (varsa) korunur, hata gösterilmez.
          break;
      }
    },
    [setBodyPhoto],
  );

  return {
    bodyPhoto,
    loadingSource,
    error,
    takePhoto: () => pick('camera'),
    chooseFromLibrary: () => pick('library'),
    removePhoto: clearBodyPhoto,
    dismissError: () => setError(null),
  };
}
