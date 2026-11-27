import * as MediaLibrary from 'expo-media-library/legacy';

/**
 * Cihaz galerisine (Fotoğraflar) kaydetme. Yalnızca yazma izni istenir;
 * uygulama kullanıcının galerisini okumaz.
 * Not: SDK 58'deki yeni `Asset.create` API'si okuma izni de gerektirebildiği için
 * yazma-odaklı `saveToLibraryAsync` (legacy) kullanılıyor.
 */

export type SaveToLibraryResult =
  | { status: 'success' }
  | { status: 'permission-denied'; canAskAgain: boolean }
  | { status: 'error'; message: string };

export async function saveImageToLibrary(fileUri: string): Promise<SaveToLibraryResult> {
  try {
    let permission = await MediaLibrary.getPermissionsAsync(true, ['photo']);
    if (!permission.granted && permission.canAskAgain) {
      permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
    }
    if (!permission.granted) {
      return { status: 'permission-denied', canAskAgain: permission.canAskAgain };
    }

    await MediaLibrary.saveToLibraryAsync(fileUri);
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}
