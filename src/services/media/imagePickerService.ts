import * as ImagePicker from 'expo-image-picker';

import type { ImageSource, LocalImage } from '@/types/image';

/**
 * expo-image-picker etrafında ince bir servis katmanı.
 * UI bileşenleri expo-image-picker'ı doğrudan çağırmaz; bu modülü kullanır.
 * Böylece izin mantığı tek yerde durur ve test/mock kolaylaşır.
 */

export type PickImageResult =
  | { status: 'success'; image: LocalImage; source: ImageSource }
  | { status: 'cancelled' }
  | { status: 'permission-denied'; source: ImageSource; canAskAgain: boolean }
  | { status: 'error'; message: string };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  // Asıl sıkıştırma/boyutlandırma görsel işleme servisinde yapılacak (bkz. ARCHITECTURE.md).
  // Burada orijinal kaliteyi koruyoruz, sadece EXIF gibi gereksiz verileri istemiyoruz.
  quality: 1,
  exif: false,
};

async function ensurePermission(
  source: ImageSource,
): Promise<{ granted: true } | { granted: false; canAskAgain: boolean }> {
  const current =
    source === 'camera'
      ? await ImagePicker.getCameraPermissionsAsync()
      : await ImagePicker.getMediaLibraryPermissionsAsync();

  if (current.granted) return { granted: true };
  if (!current.canAskAgain) return { granted: false, canAskAgain: false };

  const requested =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return requested.granted
    ? { granted: true }
    : { granted: false, canAskAgain: requested.canAskAgain };
}

function toLocalImage(asset: ImagePicker.ImagePickerAsset): LocalImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? undefined,
    fileSize: asset.fileSize ?? undefined,
  };
}

export async function pickImage(source: ImageSource): Promise<PickImageResult> {
  try {
    const permission = await ensurePermission(source);
    if (!permission.granted) {
      return { status: 'permission-denied', source, canAskAgain: permission.canAskAgain };
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

    if (result.canceled || !result.assets?.length) {
      return { status: 'cancelled' };
    }

    return { status: 'success', image: toLocalImage(result.assets[0]), source };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', message };
  }
}
