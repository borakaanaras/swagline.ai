import { prepareImage } from '@/services/image/imageProcessor';
import type { Garment } from '@/types/garment';
import type { LocalImage } from '@/types/image';
import {
  TryOnServiceError,
  type TryOnError,
  type TryOnProgress,
  type TryOnRunResult,
  type TryOnService,
} from './types';

/**
 * Try-on işini uçtan uca yürütür: hazırla → (yükle) → gönder → durum sorgula.
 * Saf TS, React'ten bağımsız (bkz. ARCHITECTURE.md §6).
 */

const SUBMIT_TIMEOUT_MS = 15_000;
const SUBMIT_RETRY_DELAYS_MS = [1_000, 2_000];
const POLL_FIRST_DELAY_MS = 2_000;
const POLL_BACKOFF = 1.5;
const POLL_MAX_DELAY_MS = 5_000;
const POLL_REQUEST_TIMEOUT_MS = 10_000;
const MAX_CONSECUTIVE_TRANSIENT_ERRORS = 3;
const OVERALL_TIMEOUT_BASE_MS = 60_000;
const OVERALL_TIMEOUT_PER_GARMENT_MS = 45_000;

export type RunTryOnJobParams = {
  service: TryOnService;
  bodyPhoto: LocalImage;
  garments: Garment[];
  signal: AbortSignal;
  onProgress?: (progress: TryOnProgress) => void;
  /** Genel zaman aşımı; verilmezse `overallTimeoutMs(parça sayısı)`. */
  timeoutMs?: number;
};

export function overallTimeoutMs(garmentCount: number): number {
  return OVERALL_TIMEOUT_BASE_MS + OVERALL_TIMEOUT_PER_GARMENT_MS * garmentCount;
}

class AbortedError extends Error {
  constructor() {
    super('Aborted');
    this.name = 'AbortedError';
  }
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new AbortedError();
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new AbortedError());
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AbortedError());
    });
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new TryOnServiceError({ code: 'NETWORK', message: 'Request timed out', retryable: true })),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function toTryOnError(error: unknown): TryOnError {
  if (error instanceof TryOnServiceError) return error.error;
  const message = error instanceof Error ? error.message : String(error);
  return { code: 'UNKNOWN', message, retryable: true };
}

function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function runTryOnJob(params: RunTryOnJobParams): Promise<TryOnRunResult> {
  const { service, bodyPhoto, garments, signal } = params;
  const onProgress = params.onProgress ?? (() => undefined);
  const deadline = Date.now() + (params.timeoutMs ?? overallTimeoutMs(garments.length));
  let jobId: string | null = null;

  const timeout = (): TryOnRunResult => {
    if (jobId) service.cancel(jobId).catch(() => undefined);
    return { status: 'error', error: { code: 'TIMEOUT', retryable: true } };
  };

  try {
    onProgress({ phase: 'preparing' });
    const bodyImage = await prepareImage(bodyPhoto, 'body');
    const preparedGarments = await Promise.all(
      garments.map(async (g) => ({
        id: g.id,
        slot: g.slot,
        removeBackground: g.removeBackground,
        image: await prepareImage(g.image, 'garment'),
      })),
    );
    throwIfAborted(signal);

    // Gerçek serviste görseller submit içinde Storage'a yüklenir; mock'ta bu adım anlık geçer.
    onProgress({ phase: 'uploading' });
    const request = { bodyImage, garments: preparedGarments, clientRequestId: createRequestId() };

    let submitted: { jobId: string } | null = null;
    for (let attempt = 0; submitted === null; attempt++) {
      try {
        submitted = await withTimeout(service.submit(request, signal), SUBMIT_TIMEOUT_MS);
      } catch (error) {
        throwIfAborted(signal);
        const tryOnError = toTryOnError(error);
        const retryDelay = SUBMIT_RETRY_DELAYS_MS[attempt];
        if (!tryOnError.retryable || retryDelay === undefined) {
          return { status: 'error', error: tryOnError };
        }
        await sleep(retryDelay, signal);
      }
    }
    jobId = submitted.jobId;
    onProgress({ phase: 'queued' });

    let pollDelay = POLL_FIRST_DELAY_MS;
    let transientErrors = 0;

    while (true) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return timeout();
      await sleep(Math.min(pollDelay, remaining), signal);
      pollDelay = Math.min(pollDelay * POLL_BACKOFF, POLL_MAX_DELAY_MS);
      if (Date.now() >= deadline) return timeout();

      let status;
      try {
        status = await withTimeout(service.getStatus(jobId, signal), POLL_REQUEST_TIMEOUT_MS);
        transientErrors = 0;
      } catch (error) {
        throwIfAborted(signal);
        const tryOnError = toTryOnError(error);
        transientErrors += 1;
        if (!tryOnError.retryable || transientErrors >= MAX_CONSECUTIVE_TRANSIENT_ERRORS) {
          return { status: 'error', error: tryOnError };
        }
        continue;
      }

      switch (status.state) {
        case 'queued':
          onProgress({ phase: 'queued' });
          break;
        case 'processing':
          onProgress({
            phase: status.phase,
            currentSlot: status.currentSlot,
            step: status.step,
            totalSteps: status.totalSteps,
          });
          break;
        case 'succeeded':
          return { status: 'success', result: status.result };
        case 'failed':
          return { status: 'error', error: status.error };
        case 'cancelled':
          return { status: 'cancelled' };
      }
    }
  } catch (error) {
    if (signal.aborted) {
      if (jobId) service.cancel(jobId).catch(() => undefined);
      return { status: 'cancelled' };
    }
    return { status: 'error', error: toTryOnError(error) };
  }
}
