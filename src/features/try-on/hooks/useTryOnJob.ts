import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isMockTryOn,
  runTryOnJob,
  tryOnService,
  tryOnTimeoutMs,
  type TryOnError,
  type TryOnProgress,
} from '@/services/tryOn';
import { getOutfitGarments } from '@/store/outfitRules';
import { useTryOnSession } from '@/store/TryOnSessionContext';

export type TryOnJobState =
  | { kind: 'running'; progress: TryOnProgress; elapsedSeconds: number }
  | { kind: 'error'; error: TryOnError }
  | { kind: 'missing-input' };

/**
 * İşleniyor ekranının akışı: ekran açılınca işi başlatır, ilerlemeyi izler,
 * başarıda sonucu oturuma yazıp `onSuccess`'i çağırır. Ekran kapanınca iş iptal edilir.
 */
export function useTryOnJob({ onSuccess }: { onSuccess: () => void }) {
  const session = useTryOnSession();
  // Ekran açıldığı andaki kombin kullanılır (iş sırasında değişmez).
  const inputRef = useRef({
    bodyPhoto: session.bodyPhoto,
    garments: getOutfitGarments(session.outfit, session.garments),
  });
  const setResultRef = useRef(session.setResult);
  const onSuccessRef = useRef(onSuccess);
  setResultRef.current = session.setResult;
  onSuccessRef.current = onSuccess;

  const controllerRef = useRef<AbortController | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<TryOnJobState>({
    kind: 'running',
    progress: { phase: 'preparing' },
    elapsedSeconds: 0,
  });

  useEffect(() => {
    const { bodyPhoto, garments } = inputRef.current;
    if (!bodyPhoto || garments.length === 0) {
      setState({ kind: 'missing-input' });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const startedAt = Date.now();
    setState({ kind: 'running', progress: { phase: 'preparing' }, elapsedSeconds: 0 });

    const ticker = setInterval(() => {
      setState((prev) =>
        prev.kind === 'running'
          ? { ...prev, elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) }
          : prev,
      );
    }, 1000);

    runTryOnJob({
      service: tryOnService,
      bodyPhoto,
      garments,
      signal: controller.signal,
      timeoutMs: tryOnTimeoutMs(garments.length),
      onProgress: (progress) =>
        setState((prev) => (prev.kind === 'running' ? { ...prev, progress } : prev)),
    }).then((outcome) => {
      clearInterval(ticker);
      if (controller.signal.aborted) return;

      switch (outcome.status) {
        case 'success': {
          const { result } = outcome;
          setResultRef.current({
            imageUri: result.imageUrl,
            width: result.width,
            height: result.height,
            bodyPhotoUri: bodyPhoto.uri,
            appliedGarments: garments.filter((g) => result.appliedGarmentIds.includes(g.id)),
            failedGarments: garments.filter((g) => result.failedGarmentIds.includes(g.id)),
            createdAt: Date.now(),
            isDemo: isMockTryOn,
          });
          onSuccessRef.current();
          break;
        }
        case 'error':
          setState({ kind: 'error', error: outcome.error });
          break;
        case 'cancelled':
          setState({ kind: 'error', error: { code: 'CANCELLED', retryable: true } });
          break;
      }
    });

    return () => {
      clearInterval(ticker);
      controller.abort();
    };
  }, [attempt]);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    state,
    garmentCount: inputRef.current.garments.length,
    bodyPhotoUri: inputRef.current.bodyPhoto?.uri ?? null,
    cancel,
    retry,
  };
}
