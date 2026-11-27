import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { LocalImage, PreparedImage } from '@/types/image';

/**
 * Görseli yüklemeye hazırlar (bkz. ARCHITECTURE.md §3): uzun kenarı sınırla (büyütme yok),
 * JPEG olarak yeniden kodla (EXIF/konum verisi atılır), hedef boyutu aşarsa kaliteyi düşür.
 */

export type ImageKind = 'body' | 'garment';

const RULES: Record<ImageKind, { maxLongEdge: number; maxBytes: number }> = {
  body: { maxLongEdge: 1536, maxBytes: 1.5 * 1024 * 1024 },
  garment: { maxLongEdge: 1024, maxBytes: 1024 * 1024 },
};

const QUALITY_STEPS = [0.85, 0.7, 0.55];

/** Oranı koruyarak uzun kenarı `maxLongEdge`'e indirir; zaten küçükse aynen döner. Saf fonksiyon. */
export function computeResizeDimensions(
  size: { width: number; height: number },
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxLongEdge || longEdge === 0) return { width: size.width, height: size.height };
  const scale = maxLongEdge / longEdge;
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function base64Bytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

export async function prepareImage(image: LocalImage, kind: ImageKind): Promise<PreparedImage> {
  const rule = RULES[kind];
  const target = computeResizeDimensions(image, rule.maxLongEdge);

  const context = ImageManipulator.manipulate(image.uri);
  if (target.width !== image.width || target.height !== image.height) {
    context.resize({ width: target.width, height: target.height });
  }
  const rendered = await context.renderAsync();

  let result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY_STEPS[0], base64: true });
  for (const quality of QUALITY_STEPS.slice(1)) {
    if (!result.base64 || base64Bytes(result.base64) <= rule.maxBytes) break;
    result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    mimeType: 'image/jpeg',
    sizeBytes: result.base64 ? base64Bytes(result.base64) : undefined,
    base64: result.base64,
  };
}
