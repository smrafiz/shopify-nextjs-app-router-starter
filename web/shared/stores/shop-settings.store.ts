import { create } from "zustand";

export interface ShopSettings {
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
    plan: string;
}

export interface ShopSettingsState {
    settings: ShopSettings | null;
    isInitialized: boolean;
    setSettings: (settings: ShopSettings) => void;
    updateSettings: (partial: Partial<ShopSettings>) => void;
    markAsInitialized: () => void;
    reset: () => void;
}

export const useShopSettingsStore = create<ShopSettingsState>()((set, get) => ({
    settings: null,
    isInitialized: false,

    setSettings: (settings) => set({ settings, isInitialized: true }),

    updateSettings: (partial) => {
        const current = get().settings;
        if (!current) return;
        set({ settings: { ...current, ...partial } });
    },

    markAsInitialized: () => set({ isInitialized: true }),

    reset: () => set({ settings: null, isInitialized: false }),
}));
