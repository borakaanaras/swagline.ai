import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { MAX_GARMENTS, type Garment, type Outfit } from '@/types/garment';
import type { LocalImage } from '@/types/image';
import { applyGarmentToOutfit, isGarmentInOutfit, removeGarmentFromOutfit } from './outfitRules';

/**
 * Tek bir deneme oturumunun istemci durumu (bkz. ARCHITECTURE.md §2).
 * Boy fotoğrafı, ürün havuzu ve o an seçili kombin. Kalıcılık Adım 11'de eklenecek.
 */
export type TryOnSessionState = {
  bodyPhoto: LocalImage | null;
  /** Ürün havuzu, eklenme sırasıyla (en fazla MAX_GARMENTS). */
  garments: Garment[];
  outfit: Outfit;
};

type Action =
  | { type: 'setBodyPhoto'; image: LocalImage }
  | { type: 'clearBodyPhoto' }
  | { type: 'addGarment'; garment: Garment }
  | { type: 'removeGarment'; garmentId: string }
  | { type: 'toggleGarmentInOutfit'; garmentId: string }
  | { type: 'setGarmentRemoveBackground'; garmentId: string; removeBackground: boolean }
  | { type: 'reset' };

const initialState: TryOnSessionState = {
  bodyPhoto: null,
  garments: [],
  outfit: {},
};

export function tryOnSessionReducer(state: TryOnSessionState, action: Action): TryOnSessionState {
  switch (action.type) {
    case 'setBodyPhoto':
      return { ...state, bodyPhoto: action.image };
    case 'clearBodyPhoto':
      return { ...state, bodyPhoto: null };
    case 'addGarment': {
      if (state.garments.length >= MAX_GARMENTS) return state;
      // Yeni eklenen ürün doğrudan kombine de girer; kullanıcı istemezse dokunup çıkarır.
      return {
        ...state,
        garments: [...state.garments, action.garment],
        outfit: applyGarmentToOutfit(state.outfit, action.garment).outfit,
      };
    }
    case 'removeGarment':
      return {
        ...state,
        garments: state.garments.filter((g) => g.id !== action.garmentId),
        outfit: removeGarmentFromOutfit(state.outfit, action.garmentId),
      };
    case 'toggleGarmentInOutfit': {
      const garment = state.garments.find((g) => g.id === action.garmentId);
      if (!garment) return state;
      const outfit = isGarmentInOutfit(state.outfit, garment.id)
        ? removeGarmentFromOutfit(state.outfit, garment.id)
        : applyGarmentToOutfit(state.outfit, garment).outfit;
      return { ...state, outfit };
    }
    case 'setGarmentRemoveBackground':
      return {
        ...state,
        garments: state.garments.map((g) =>
          g.id === action.garmentId ? { ...g, removeBackground: action.removeBackground } : g,
        ),
      };
    case 'reset':
      return initialState;
  }
}

type ContextValue = TryOnSessionState & {
  setBodyPhoto: (image: LocalImage) => void;
  clearBodyPhoto: () => void;
  addGarment: (garment: Garment) => void;
  removeGarment: (garmentId: string) => void;
  toggleGarmentInOutfit: (garmentId: string) => void;
  setGarmentRemoveBackground: (garmentId: string, removeBackground: boolean) => void;
  reset: () => void;
};

const TryOnSessionContext = createContext<ContextValue | null>(null);

export function TryOnSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tryOnSessionReducer, initialState);

  const value = useMemo<ContextValue>(
    () => ({
      ...state,
      setBodyPhoto: (image) => dispatch({ type: 'setBodyPhoto', image }),
      clearBodyPhoto: () => dispatch({ type: 'clearBodyPhoto' }),
      addGarment: (garment) => dispatch({ type: 'addGarment', garment }),
      removeGarment: (garmentId) => dispatch({ type: 'removeGarment', garmentId }),
      toggleGarmentInOutfit: (garmentId) => dispatch({ type: 'toggleGarmentInOutfit', garmentId }),
      setGarmentRemoveBackground: (garmentId, removeBackground) =>
        dispatch({ type: 'setGarmentRemoveBackground', garmentId, removeBackground }),
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
