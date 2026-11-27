import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Ekrandaki bir görünümü (ör. logolu sonuç görseli) JPEG dosyasına çevirir.
 * Çıktı, görünümün cihazdaki piksel boyutundadır (dp × PixelRatio).
 */

export type CaptureResult = { status: 'success'; uri: string } | { status: 'error'; message: string };

export async function captureViewToJpeg(view: RefObject<ComponentRef<typeof View> | null>): Promise<CaptureResult> {
  try {
    const uri = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'tmpfile' });
    return { status: 'success', uri };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}
