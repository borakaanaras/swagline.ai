import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { MAX_GARMENTS, type Garment, type GarmentSlot, type Outfit } from '@/types/garment';
import type { LocalImage } from '@/types/image';
import type { TryOnOutcome } from '@/types/result';
import { applyGarmentToOutfit, isInOutfit, removeGarmentFromOutfit } from './outfitRules';

/**
 * Tek bir deneme oturumunun istemci durumu: boy fotoğrafı, ürün havuzu ve seçili kombin.
 * Aktif iş ve sonuçlar sonraki adımlarda eklenecek (bkz. TODO.md).
 */
export type TryOnSessionState = {
  bodyPhoto: LocalImage | null;
  garments: Garment[];
  outfit: Outfit;
  /** Son başarılı deneme sonucu. */
  result: TryOnOutcome | null;
};

type Action =
  | { type: 'setBodyPhoto'; image: LocalImage }
  | { type: 'clearBodyPhoto' }
  | { type: 'addGarment'; garment: Garment }
  | { type: 'removeGarment'; id: string }
  | { type: 'setGarmentSlot'; id: string; slot: GarmentSlot }
  | { type: 'toggleGarmentInOutfit'; id: string }
  | { type: 'setRemoveBackground'; id: string; value: boolean }
  | { type: 'setResult'; result: TryOnOutcome }
  | { type: 'reset' };

const initialState: TryOnSessionState = {
  bodyPhoto: null,
  garments: [],
  outfit: {},
  result: null,
};

function reducer(state: TryOnSessionState, action: Action): TryOnSessionState {
  switch (action.type) {
    case 'setBodyPhoto':
      return { ...state, bodyPhoto: action.image };
    case 'clearBodyPhoto':
      return { ...state, bodyPhoto: null };
    case 'addGarment': {
      if (state.garments.length >= MAX_GARMENTS) return state;
      // Yeni eklenen ürün doğrudan kombine girer.
      return {
        ...state,
        garments: [...state.garments, action.garment],
        outfit: applyGarmentToOutfit(state.outfit, action.garment).outfit,
      };
    }
    case 'removeGarment':
      return {
        ...state,
        garments: state.garments.filter((g) => g.id !== action.id),
        outfit: removeGarmentFromOutfit(state.outfit, action.id),
      };
    case 'setGarmentSlot': {
      const current = state.garments.find((g) => g.id === action.id);
      if (!current) return state;
      const updated: Garment = { ...current, slot: action.slot };
      return {
        ...state,
        garments: state.garments.map((g) => (g.id === action.id ? updated : g)),
        outfit: isInOutfit(state.outfit, action.id)
          ? applyGarmentToOutfit(state.outfit, updated).outfit
          : state.outfit,
      };
    }
    case 'toggleGarmentInOutfit': {
      const garment = state.garments.find((g) => g.id === action.id);
      if (!garment) return state;
      return {
        ...state,
        outfit: isInOutfit(state.outfit, action.id)
          ? removeGarmentFromOutfit(state.outfit, action.id)
          : applyGarmentToOutfit(state.outfit, garment).outfit,
      };
    }
    case 'setRemoveBackground':
      return {
        ...state,
        garments: state.garments.map((g) =>
          g.id === action.id ? { ...g, removeBackground: action.value } : g,
        ),
      };
    case 'setResult':
      return { ...state, result: action.result };
    case 'reset':
      return initialState;
  }
}

type ContextValue = TryOnSessionState & {
  setBodyPhoto: (image: LocalImage) => void;
  clearBodyPhoto: () => void;
  addGarment: (garment: Garment) => void;
  removeGarment: (id: string) => void;
  setGarmentSlot: (id: string, slot: GarmentSlot) => void;
  toggleGarmentInOutfit: (id: string) => void;
  setRemoveBackground: (id: string, value: boolean) => void;
  setResult: (result: TryOnOutcome) => void;
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
      addGarment: (garment) => dispatch({ type: 'addGarment', garment }),
      removeGarment: (id) => dispatch({ type: 'removeGarment', id }),
      setGarmentSlot: (id, slot) => dispatch({ type: 'setGarmentSlot', id, slot }),
      toggleGarmentInOutfit: (id) => dispatch({ type: 'toggleGarmentInOutfit', id }),
      setRemoveBackground: (id, value) => dispatch({ type: 'setRemoveBackground', id, value }),
      setResult: (result) => dispatch({ type: 'setResult', result }),
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
