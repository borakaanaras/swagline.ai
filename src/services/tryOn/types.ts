import type { GarmentSlot } from '@/types/garment';
import type { PreparedImage } from '@/types/image';

/**
 * Try-on servis sözleşmesi (bkz. ARCHITECTURE.md §5.1).
 * `mock` ve (Adım 14'te) `firebase` uygulamaları bu arayüzü birebir uygular.
 */
export interface TryOnService {
  /** İşi başlatır; görseller önceden hazırlanmış olmalı. */
  submit(request: TryOnRequest, signal?: AbortSignal): Promise<TryOnSubmitResponse>;
  getStatus(jobId: string, signal?: AbortSignal): Promise<TryOnJobStatus>;
  cancel(jobId: string): Promise<void>;
}

export type TryOnRequestGarment = {
  id: string;
  slot: GarmentSlot;
  image: PreparedImage;
  removeBackground: boolean;
};

export type TryOnRequest = {
  bodyImage: PreparedImage;
  /** 1..7 parça */
  garments: TryOnRequestGarment[];
  /** İdempotency anahtarı */
  clientRequestId: string;
};

export type TryOnSubmitResponse = { jobId: string; estimatedSeconds?: number };

export type TryOnPhase = 'queued' | 'removing-background' | 'dressing';

export type TryOnJobStatus =
  | { state: 'queued' }
  | {
      state: 'processing';
      phase: TryOnPhase;
      currentSlot?: GarmentSlot;
      step: number;
      totalSteps: number;
    }
  | { state: 'succeeded'; result: TryOnResult }
  | { state: 'failed'; error: TryOnError }
  | { state: 'cancelled' };

export type TryOnResult = {
  /** Geçici URL (gerçek serviste ≈1 saat); istemci hemen cihaza indirir. */
  imageUrl: string;
  width: number;
  height: number;
  appliedGarmentIds: string[];
  failedGarmentIds: string[];
  warnings: string[];
};

export type TryOnErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'INVALID_BODY_IMAGE'
  | 'INVALID_GARMENT_IMAGE'
  | 'UNSUPPORTED_SLOT'
  | 'NO_CREDITS'
  | 'UNAUTHENTICATED'
  | 'CANCELLED'
  | 'UNKNOWN';

export type TryOnError = {
  code: TryOnErrorCode;
  message?: string;
  retryable: boolean;
  garmentId?: string;
};

/** Servislerin beklenen hataları taşımak için fırlattığı hata (yürütücü yakalar ve eşler). */
export class TryOnServiceError extends Error {
  readonly error: TryOnError;

  constructor(error: TryOnError) {
    super(error.message ?? error.code);
    this.name = 'TryOnServiceError';
    this.error = error;
  }
}

/** Yürütücünün UI'a bildirdiği ilerleme. */
export type TryOnProgress = {
  phase: 'preparing' | 'uploading' | TryOnPhase;
  currentSlot?: GarmentSlot;
  step?: number;
  totalSteps?: number;
};

/** Yürütücü sonucu: servislerdeki gibi ayrık birleşim. */
export type TryOnRunResult =
  | { status: 'success'; result: TryOnResult }
  | { status: 'error'; error: TryOnError }
  | { status: 'cancelled' };
