import type { Garment } from './garment';

/** Cihazda gösterilen bir deneme sonucu. Geçmişe kaydı Adım 11'de. */
export type TryOnOutcome = {
  /** Cihazdaki (veya mock'ta yerel) sonuç görseli. */
  imageUri: string;
  width: number;
  height: number;
  /** Denemedeki boy fotoğrafı (önce/sonra karşılaştırması için). */
  bodyPhotoUri: string;
  appliedGarments: Garment[];
  failedGarments: Garment[];
  createdAt: number;
  /** Mock servisle üretildiyse true. */
  isDemo: boolean;
};
