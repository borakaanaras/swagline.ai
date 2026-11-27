import { DRESSING_ORDER } from '@/types/garment';
import {
  TryOnServiceError,
  type TryOnJobStatus,
  type TryOnRequest,
  type TryOnService,
  type TryOnSubmitResponse,
} from './types';

/**
 * Sahte try-on servisi (bkz. ARCHITECTURE.md §7).
 * Gerçek servisle aynı sözleşmeyi uygular; durum, gönderimden bu yana geçen
 * duvar saati süresinden hesaplanır (uygulama arka plana atılsa da tutarlı kalır).
 * Sonuç görseli şimdilik boy fotoğrafının kendisidir.
 */

export type MockScenario =
  | 'success'
  | 'slow'
  | 'timeout'
  | 'invalid-body'
  | 'invalid-garment'
  | 'partial'
  | 'network-flaky'
  | 'rate-limited'
  | 'no-credits';

const QUEUED_MS = 1500;
const BG_REMOVAL_MS_PER_GARMENT = 2500;
const DRESSING_MS_PER_GARMENT = 5000;
const SLOW_MULTIPLIER = 3;
const FLAKY_FAILURES = 2;

type MockJob = {
  request: TryOnRequest;
  createdAt: number;
  cancelled: boolean;
  flakyFailuresLeft: number;
  scenario: MockScenario;
};

let scenario: MockScenario = 'success';
const jobs = new Map<string, MockJob>();

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Aborted'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    });
  });
}

function computeStatus(job: MockJob): TryOnJobStatus {
  if (job.cancelled) return { state: 'cancelled' };

  const speed = job.scenario === 'slow' ? SLOW_MULTIPLIER : 1;
  const elapsed = (Date.now() - job.createdAt) / speed;
  const ordered = [...job.request.garments].sort(
    (a, b) => DRESSING_ORDER.indexOf(a.slot) - DRESSING_ORDER.indexOf(b.slot),
  );
  const bgGarments = ordered.filter((g) => g.removeBackground);

  if (elapsed < QUEUED_MS) return { state: 'queued' };

  if (job.scenario === 'invalid-body') {
    return {
      state: 'failed',
      error: { code: 'INVALID_BODY_IMAGE', retryable: false },
    };
  }

  const bgElapsed = elapsed - QUEUED_MS;
  const bgTotal = bgGarments.length * BG_REMOVAL_MS_PER_GARMENT;
  if (bgElapsed < bgTotal) {
    const index = Math.floor(bgElapsed / BG_REMOVAL_MS_PER_GARMENT);
    return {
      state: 'processing',
      phase: 'removing-background',
      currentSlot: bgGarments[index].slot,
      step: index + 1,
      totalSteps: bgGarments.length,
    };
  }

  if (job.scenario === 'invalid-garment') {
    return {
      state: 'failed',
      error: { code: 'INVALID_GARMENT_IMAGE', retryable: false, garmentId: ordered[0].id },
    };
  }

  const dressElapsed = bgElapsed - bgTotal;
  const dressTotal = ordered.length * DRESSING_MS_PER_GARMENT;
  if (job.scenario === 'timeout' || dressElapsed < dressTotal) {
    const index = Math.min(Math.floor(dressElapsed / DRESSING_MS_PER_GARMENT), ordered.length - 1);
    return {
      state: 'processing',
      phase: 'dressing',
      currentSlot: ordered[index].slot,
      step: index + 1,
      totalSteps: ordered.length,
    };
  }

  const failed = job.scenario === 'partial' && ordered.length > 1 ? [ordered[ordered.length - 1]] : [];
  const { bodyImage } = job.request;
  return {
    state: 'succeeded',
    result: {
      imageUrl: bodyImage.uri,
      width: bodyImage.width,
      height: bodyImage.height,
      appliedGarmentIds: ordered.filter((g) => !failed.includes(g)).map((g) => g.id),
      failedGarmentIds: failed.map((g) => g.id),
      warnings: [],
    },
  };
}

export const mockTryOnService: TryOnService & {
  configure: (options: { scenario: MockScenario }) => void;
  getScenario: () => MockScenario;
} = {
  configure(options) {
    scenario = options.scenario;
  },

  getScenario() {
    return scenario;
  },

  async submit(request, signal): Promise<TryOnSubmitResponse> {
    await delay(300 + Math.random() * 300, signal);

    if (scenario === 'rate-limited') {
      throw new TryOnServiceError({ code: 'RATE_LIMITED', retryable: false });
    }
    if (scenario === 'no-credits') {
      throw new TryOnServiceError({ code: 'NO_CREDITS', retryable: false });
    }

    const jobId = `mock-${request.clientRequestId}`;
    if (!jobs.has(jobId)) {
      jobs.set(jobId, {
        request,
        createdAt: Date.now(),
        cancelled: false,
        flakyFailuresLeft: scenario === 'network-flaky' ? FLAKY_FAILURES : 0,
        scenario,
      });
    }
    const n = request.garments.length;
    return { jobId, estimatedSeconds: Math.round((QUEUED_MS + n * (BG_REMOVAL_MS_PER_GARMENT + DRESSING_MS_PER_GARMENT)) / 1000) };
  },

  async getStatus(jobId, signal): Promise<TryOnJobStatus> {
    await delay(150, signal);
    const job = jobs.get(jobId);
    if (!job) {
      throw new TryOnServiceError({ code: 'SERVER', message: 'Job not found', retryable: false });
    }
    if (job.flakyFailuresLeft > 0) {
      job.flakyFailuresLeft -= 1;
      throw new TryOnServiceError({ code: 'NETWORK', retryable: true });
    }
    const status = computeStatus(job);
    if (status.state === 'succeeded' || status.state === 'failed' || status.state === 'cancelled') {
      jobs.delete(jobId);
    }
    return status;
  },

  async cancel(jobId) {
    const job = jobs.get(jobId);
    if (job) job.cancelled = true;
  },
};
