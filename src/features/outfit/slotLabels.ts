import type { GarmentSlot } from '@/types/garment';

/** Yuvaların kullanıcıya görünen adları (tek yerde; ileride i18n'e taşınır). */
export const GARMENT_SLOT_LABELS: Record<GarmentSlot, string> = {
  top: 'Üst',
  bottom: 'Alt',
  dress: 'Elbise / tulum',
  outerwear: 'Dış giyim',
  shoes: 'Ayakkabı',
  eyewear: 'Gözlük',
  accessory: 'Aksesuar',
};

export const GARMENT_SLOT_EXAMPLES: Record<GarmentSlot, string> = {
  top: 'Tişört, gömlek, kazak',
  bottom: 'Pantolon, etek, şort',
  dress: 'Elbise, tulum',
  outerwear: 'Ceket, mont',
  shoes: 'Spor ayakkabı, bot',
  eyewear: 'Gözlük, güneş gözlüğü',
  accessory: 'Çanta, şapka, takı, saat',
};
