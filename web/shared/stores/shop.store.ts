import { create } from "zustand";

export interface ShopState {
  domain: string | null;
  name: string | null;
  email: string | null;
  plan: string | null;
  currency: string | null;
  timezone: string | null;
  installedAt: string | null;
  isLoaded: boolean;
}

interface ShopActions {
  setShop: (data: Partial<ShopState>) => void;
  reset: () => void;
}

export type ShopStore = ShopState & ShopActions;

const initialState: ShopState = {
  domain: null,
  name: null,
  email: null,
  plan: null,
  currency: null,
  timezone: null,
  installedAt: null,
  isLoaded: false,
};

export const useShopStore = create<ShopStore>()((set) => ({
  ...initialState,

  setShop: (data) => set((state) => ({ ...state, ...data })),

  reset: () => set(initialState),
}));
