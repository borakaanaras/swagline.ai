import { env } from '@/config/env';
import { devServerTryOnService } from './devServerTryOnService';
import { mockTryOnService } from './mockTryOnService';
import { overallTimeoutMs } from './runTryOnJob';
import type { TryOnService } from './types';

/**
 * UI yalnızca bu dosyayı import eder; hangi uygulamanın çalıştığını bilmez.
 * Seçim `EXPO_PUBLIC_TRYON_BACKEND` ile: `mock` (varsayılan) | `dev-server` (geçici).
 * `firebaseTryOnService` Adım 14'te eklenecek.
 */
export const tryOnService: TryOnService =
  env.tryOnBackend === 'dev-server' ? devServerTryOnService : mockTryOnService;

/** Sonuç ekranında "demo" rozeti göstermek için. */
export const isMockTryOn = tryOnService === mockTryOnService;

/**
 * Genel zaman aşımı. Replicate'teki topluluk modeli soğuk başlangıçta birkaç dakika
 * bekletebildiği için dev-server'da daha cömert tutulur.
 */
export function tryOnTimeoutMs(garmentCount: number): number {
  return env.tryOnBackend === 'dev-server' ? 300_000 + 60_000 * garmentCount : overallTimeoutMs(garmentCount);
}

export { mockTryOnService, type MockScenario } from './mockTryOnService';
export { overallTimeoutMs, runTryOnJob } from './runTryOnJob';
export * from './types';
