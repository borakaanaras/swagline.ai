import type { LocalImage } from './image';

/** Kombindeki ürün yuvaları (kategori). Ayrıntı: SPEC.md (2). */
export type GarmentSlot = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'eyewear' | 'accessory';

/**
 * Giydirme sırası; backend ve mock aynı sırayı kullanır (ARCHITECTURE.md §2).
 * Kombin çubuğu ve yuva seçici de bu sırayla gösterilir.
 */
export const GARMENT_SLOT_ORDER: readonly GarmentSlot[] = [
  'bottom',
  'dress',
  'top',
  'outerwear',
  'shoes',
  'eyewear',
  'accessory',
];

/** Bir oturumdaki ürün havuzunun üst sınırı. */
export const MAX_GARMENTS = 10;

export type Garment = {
  /** İstemcide üretilen kimlik. */
  id: string;
  /** Kullanıcının seçtiği orijinal görsel. */
  image: LocalImage;
  slot: GarmentSlot;
  /** Varsayılan true; kullanıcı "Orijinali kullan" derse false. */
  removeBackground: boolean;
};

/** Yuva → ürün kimliği. Her yuvada en fazla 1 ürün. */
export type Outfit = Partial<Record<GarmentSlot, string>>;
