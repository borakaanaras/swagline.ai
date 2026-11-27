import { GARMENT_SLOTS, type Garment, type GarmentSlot, type Outfit } from '@/types/garment';

/**
 * Kombin kuralları — saf fonksiyonlar (React'ten bağımsız, birim test edilebilir).
 * - Her yuvada en fazla 1 ürün; aynı yuvaya yeni ürün eskisinin yerine geçer.
 * - `dress` seçilince `top` ve `bottom` çıkar; `top` veya `bottom` seçilince `dress` çıkar.
 */

const CONFLICTING_SLOTS: Record<GarmentSlot, readonly GarmentSlot[]> = {
  top: ['dress'],
  bottom: ['dress'],
  dress: ['top', 'bottom'],
  outerwear: [],
  shoes: [],
  eyewear: [],
  accessory: [],
};

export type ApplyGarmentResult = {
  outfit: Outfit;
  /** Bu seçim yüzünden kombinden çıkan ürünlerin kimlikleri. */
  displacedIds: string[];
};

export function removeGarmentFromOutfit(outfit: Outfit, garmentId: string): Outfit {
  const next: Outfit = {};
  for (const slot of GARMENT_SLOTS) {
    const id = outfit[slot];
    if (id && id !== garmentId) next[slot] = id;
  }
  return next;
}

export function applyGarmentToOutfit(outfit: Outfit, garment: Garment): ApplyGarmentResult {
  // Ürün başka bir yuvada kayıtlıysa (kategori değiştiyse) önce oradan çıkar.
  const next = removeGarmentFromOutfit(outfit, garment.id);
  const displacedIds: string[] = [];

  for (const slot of [garment.slot, ...CONFLICTING_SLOTS[garment.slot]]) {
    const id = next[slot];
    if (id) {
      displacedIds.push(id);
      delete next[slot];
    }
  }

  next[garment.slot] = garment.id;
  return { outfit: next, displacedIds };
}

export function isInOutfit(outfit: Outfit, garmentId: string): boolean {
  return GARMENT_SLOTS.some((slot) => outfit[slot] === garmentId);
}

/** Kombindeki ürünleri yuva sırasıyla döndürür. */
export function getOutfitGarments(outfit: Outfit, garments: readonly Garment[]): Garment[] {
  const result: Garment[] = [];
  for (const slot of GARMENT_SLOTS) {
    const garment = garments.find((g) => g.id === outfit[slot]);
    if (garment) result.push(garment);
  }
  return result;
}

/** Cihaz içi yerel kimlik (sunucuya gönderilen idempotency anahtarı değildir). */
export function createGarmentId(): string {
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
