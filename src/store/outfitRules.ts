import type { Garment, GarmentSlot, Outfit } from '@/types/garment';

/** Birlikte seçilemeyen yuvalar: elbise üst/altı, üst/alt elbiseyi dışarıda bırakır. */
const CONFLICTS: Partial<Record<GarmentSlot, readonly GarmentSlot[]>> = {
  dress: ['top', 'bottom'],
  top: ['dress'],
  bottom: ['dress'],
};

export type ApplyGarmentResult = {
  outfit: Outfit;
  /** Bu ürün yüzünden kombinden çıkan ürünlerin yuvaları (aynı yuvadaki eski ürün hariç). */
  removedSlots: GarmentSlot[];
};

/**
 * Bir ürünü kombine ekler (saf fonksiyon).
 * - Aynı yuvadaki eski ürünün yerine geçer.
 * - `dress` seçilince `top` ve `bottom`; `top` veya `bottom` seçilince `dress` çıkar.
 */
export function applyGarmentToOutfit(outfit: Outfit, garment: Pick<Garment, 'id' | 'slot'>): ApplyGarmentResult {
  const next: Outfit = { ...outfit, [garment.slot]: garment.id };
  const removedSlots: GarmentSlot[] = [];
  for (const slot of CONFLICTS[garment.slot] ?? []) {
    if (next[slot] !== undefined) {
      delete next[slot];
      removedSlots.push(slot);
    }
  }
  return { outfit: next, removedSlots };
}

/** Bir ürünü kombinden çıkarır (hangi yuvada olursa olsun). */
export function removeGarmentFromOutfit(outfit: Outfit, garmentId: string): Outfit {
  const next: Outfit = {};
  for (const [slot, id] of Object.entries(outfit) as [GarmentSlot, string][]) {
    if (id !== garmentId) next[slot] = id;
  }
  return next;
}

export function isGarmentInOutfit(outfit: Outfit, garmentId: string): boolean {
  return Object.values(outfit).includes(garmentId);
}
