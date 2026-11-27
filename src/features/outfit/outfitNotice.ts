import type { Garment } from '@/types/garment';
import { GARMENT_SLOT_LABELS } from './slotLabels';

/**
 * Bir ürün kombine girerken başka ürünler çıkarıldıysa gösterilecek kısa bilgi notu.
 * Çıkan ürün yoksa null döner.
 */
export function describeDisplacement(selected: Garment, displaced: readonly Garment[]): string | null {
  if (displaced.length === 0) return null;

  const conflicting = displaced.filter((g) => g.slot !== selected.slot);
  if (conflicting.length === 0) {
    return `${GARMENT_SLOT_LABELS[selected.slot]} kombinde değiştirildi.`;
  }

  const removed = [...new Set(conflicting.map((g) => GARMENT_SLOT_LABELS[g.slot]))].join(' ve ');
  return `${GARMENT_SLOT_LABELS[selected.slot]} seçildiği için ${removed} kombinden çıkarıldı.`;
}
