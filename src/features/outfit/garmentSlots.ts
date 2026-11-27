import type { GarmentSlot } from '@/types/garment';

/** Kullanıcıya görünen yuva metinleri (tek yerde; ileride i18n'e taşınacak). */
export const GARMENT_SLOT_TEXT: Record<GarmentSlot, { label: string; noun: string; examples: string }> = {
  top: { label: 'Üst', noun: 'üst', examples: 'Tişört, gömlek, kazak' },
  bottom: { label: 'Alt', noun: 'alt', examples: 'Pantolon, etek, şort' },
  dress: { label: 'Elbise / tulum', noun: 'elbise / tulum', examples: 'Elbise, tulum' },
  outerwear: { label: 'Dış giyim', noun: 'dış giyim', examples: 'Ceket, mont' },
  shoes: { label: 'Ayakkabı', noun: 'ayakkabı', examples: 'Spor ayakkabı, bot, topuklu' },
  eyewear: { label: 'Gözlük', noun: 'gözlük', examples: 'Gözlük, güneş gözlüğü' },
  accessory: { label: 'Aksesuar', noun: 'aksesuar', examples: 'Çanta, şapka, takı, saat' },
};

export function slotLabel(slot: GarmentSlot): string {
  return GARMENT_SLOT_TEXT[slot].label;
}
