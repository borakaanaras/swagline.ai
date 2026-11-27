import type { LocalImage } from './image';

/**
 * Ürün yuvaları (kategori). Dizi sırası ekranda gösterim sırasıdır.
 * Giydirme sırası farklıdır ve try-on servisinde tanımlanır (bkz. ARCHITECTURE.md §2).
 */
export const GARMENT_SLOTS = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'eyewear',
  'accessory',
] as const;

export type GarmentSlot = (typeof GARMENT_SLOTS)[number];

/** Ürün havuzundaki tek bir ürün fotoğrafı. */
export type Garment = {
  /** İstemcide üretilen yerel kimlik. */
  id: string;
  /** Kullanıcının seçtiği orijinal görsel. */
  image: LocalImage;
  slot: GarmentSlot;
  /** Varsayılan true; kullanıcı "Orijinali kullan" derse false. */
  removeBackground: boolean;
};

/** Seçili kombin: yuva → ürün kimliği. Her yuvada en fazla 1 ürün. */
export type Outfit = Partial<Record<GarmentSlot, string>>;

/** Oturumdaki ürün havuzunun üst sınırı. */
export const MAX_GARMENTS = 10;

/**
 * Giydirme sırası (backend ve mock aynı sırayı kullanır, bkz. ARCHITECTURE.md §2).
 * `dress` ile `top`/`bottom` aynı kombinde olamayacağı için çakışma yoktur.
 */
export const DRESSING_ORDER: readonly GarmentSlot[] = [
  'bottom',
  'dress',
  'top',
  'outerwear',
  'shoes',
  'eyewear',
  'accessory',
];
