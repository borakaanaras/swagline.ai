import { env } from '@/config/env';
import type { PreparedImage } from '@/types/image';
import {
  TryOnServiceError,
  type TryOnError,
  type TryOnJobStatus,
  type TryOnService,
  type TryOnSubmitResponse,
} from './types';

/**
 * GEÇİCİ: Mac'te çalışan `dev-server/` (Replicate IDM-VTON köprüsü) ile konuşan uygulama.
 * Replicate token'ı sunucudadır; istemci yalnızca kendi sunucumuzla konuşur.
 * Firebase Functions hazır olunca (Adım 14) `firebaseTryOnService` bunun yerini alır.
 */

function isTryOnError(value: unknown): value is TryOnError {
  return typeof value === 'object' && value !== null && 'code' in value && 'retryable' in value;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.devServerUrl) {
    throw new TryOnServiceError({ code: 'SERVER', message: 'EXPO_PUBLIC_DEV_SERVER_URL boş', retryable: false });
  }

  let res: Response;
  try {
    res = await fetch(`${env.devServerUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-dev-key': env.devServerKey, ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new TryOnServiceError({ code: 'NETWORK', message: 'Sunucuya ulaşılamadı', retryable: true });
  }

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload ? payload.error : undefined;
    throw new TryOnServiceError(
      isTryOnError(error) ? error : { code: 'SERVER', message: `HTTP ${res.status}`, retryable: res.status >= 500 },
    );
  }
  return payload as T;
}

function toWire(image: PreparedImage) {
  if (!image.base64) {
    throw new TryOnServiceError({ code: 'INVALID_BODY_IMAGE', message: 'Görsel hazırlanamadı', retryable: false });
  }
  return { base64: image.base64, width: image.width, height: image.height };
}

export const devServerTryOnService: TryOnService = {
  submit(req, signal) {
    const body = JSON.stringify({
      clientRequestId: req.clientRequestId,
      bodyImage: toWire(req.bodyImage),
      garments: req.garments.map((g) => ({
        id: g.id,
        slot: g.slot,
        removeBackground: g.removeBackground,
        image: toWire(g.image),
      })),
    });
    return request<TryOnSubmitResponse>('/try-on', { method: 'POST', body, signal });
  },

  getStatus(jobId, signal) {
    return request<TryOnJobStatus>(`/try-on/${encodeURIComponent(jobId)}`, { signal });
  },

  async cancel(jobId) {
    await request<unknown>(`/try-on/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' });
  },
};
