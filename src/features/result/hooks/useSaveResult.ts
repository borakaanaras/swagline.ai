import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import type { View } from 'react-native';

import { captureViewToJpeg } from '@/services/image/viewCaptureService';
import { saveImageToLibrary } from '@/services/media/mediaLibraryService';

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'permission-denied'; canAskAgain: boolean }
  | { kind: 'error' };

const SAVED_BADGE_MS = 2500;

/**
 * Logolu sonuç görselini (dışa aktarma görünümünden) yakalar ve Fotoğraflar'a kaydeder.
 */
export function useSaveResult() {
  const exportRef = useRef<ComponentRef<typeof View>>(null);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });

  useEffect(() => {
    if (state.kind !== 'saved') return;
    const timer = setTimeout(() => setState({ kind: 'idle' }), SAVED_BADGE_MS);
    return () => clearTimeout(timer);
  }, [state.kind]);

  const save = useCallback(async () => {
    setState({ kind: 'saving' });
    const captured = await captureViewToJpeg(exportRef);
    if (captured.status === 'error') {
      setState({ kind: 'error' });
      return;
    }
    const saved = await saveImageToLibrary(captured.uri);
    switch (saved.status) {
      case 'success':
        setState({ kind: 'saved' });
        break;
      case 'permission-denied':
        setState({ kind: 'permission-denied', canAskAgain: saved.canAskAgain });
        break;
      case 'error':
        setState({ kind: 'error' });
        break;
    }
  }, []);

  return { exportRef, state, save, reset: () => setState({ kind: 'idle' }) };
}
