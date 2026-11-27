import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { LocalImage } from '@/types/image';

/**
 * Tek bir deneme oturumunun istemci durumu.
 * Şimdilik sadece boy fotoğrafını tutar; ürünler ve sonuçlar sonraki
 * adımlarda eklenecek (bkz. TODO.md).
 */
export type TryOnSessionState = {
  bodyPhoto: LocalImage | null;
};

type Action = { type: 'setBodyPhoto'; image: LocalImage } | { type: 'clearBodyPhoto' } | { type: 'reset' };

const initialState: TryOnSessionState = {
  bodyPhoto: null,
};

function reducer(state: TryOnSessionState, action: Action): TryOnSessionState {
  switch (action.type) {
    case 'setBodyPhoto':
      return { ...state, bodyPhoto: action.image };
    case 'clearBodyPhoto':
      return { ...state, bodyPhoto: null };
    case 'reset':
      return initialState;
  }
}

type ContextValue = TryOnSessionState & {
  setBodyPhoto: (image: LocalImage) => void;
  clearBodyPhoto: () => void;
  reset: () => void;
};

const TryOnSessionContext = createContext<ContextValue | null>(null);

export function TryOnSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      setBodyPhoto: (image) => dispatch({ type: 'setBodyPhoto', image }),
      clearBodyPhoto: () => dispatch({ type: 'clearBodyPhoto' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state],
  );

  return <TryOnSessionContext.Provider value={value}>{children}</TryOnSessionContext.Provider>;
}

export function useTryOnSession(): ContextValue {
  const ctx = useContext(TryOnSessionContext);
  if (!ctx) {
    throw new Error('useTryOnSession, TryOnSessionProvider içinde kullanılmalı.');
  }
  return ctx;
}
