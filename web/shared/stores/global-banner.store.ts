import { create } from "zustand";

export type BannerType = "success" | "error" | "warning" | "info";

export interface Banner {
    id: string;
    type: BannerType;
    message: string;
    title?: string;
    key?: string;
    dismissible?: boolean;
    autoHide?: boolean;
    duration?: number;
    timestamp: number;
}

export type BannerInput = Pick<Banner, "message"> &
    Partial<Omit<Banner, "id" | "timestamp" | "message">>;

export interface GlobalBannerState {
    banners: Banner[];
    _timeouts: Map<string, ReturnType<typeof setTimeout>>;
    addBanner: (banner: BannerInput) => string;
    removeBanner: (id: string) => void;
    removeBannerByKey: (key: string) => void;
    clearAllBanners: () => void;
    getBannersByType: (type: BannerType) => Banner[];
}

export const useGlobalBannerStore = create<GlobalBannerState>((set, get) => ({
    banners: [],
    _timeouts: new Map(),

    addBanner: (banner) => {
        const id = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const isErrorOrWarning = banner.type === "error" || banner.type === "warning";

        const newBanner: Banner = {
            ...banner,
            id,
            type: banner.type ?? "info",
            title: banner.title ?? "",
            dismissible: banner.dismissible ?? true,
            autoHide: isErrorOrWarning ? false : (banner.autoHide ?? true),
            duration: banner.duration ?? 5000,
            timestamp: Date.now(),
        };

        if (newBanner.autoHide && newBanner.duration) {
            const t = setTimeout(() => {
                get().removeBanner(id);
                get()._timeouts.delete(id);
            }, newBanner.duration);
            set((state) => ({
                banners: [...state.banners, newBanner],
                _timeouts: new Map(state._timeouts).set(id, t),
            }));
        } else {
            set((state) => ({ banners: [...state.banners, newBanner] }));
        }

        return id;
    },

    removeBanner: (id) => {
        const t = get()._timeouts.get(id);
        if (t) clearTimeout(t);
        set((state) => ({
            banners: state.banners.filter((b) => b.id !== id),
            _timeouts: new Map([...state._timeouts].filter(([k]) => k !== id)),
        }));
    },

    removeBannerByKey: (key) => {
        const banner = get().banners.find((b) => b.key === key);
        if (banner) {
            const t = get()._timeouts.get(banner.id);
            if (t) clearTimeout(t);
        }
        set((state) => ({
            banners: state.banners.filter((b) => b.key !== key),
            _timeouts: banner
                ? new Map([...state._timeouts].filter(([k]) => k !== banner.id))
                : state._timeouts,
        }));
    },

    clearAllBanners: () => {
        get()._timeouts.forEach((t) => clearTimeout(t));
        set({ banners: [], _timeouts: new Map() });
    },

    getBannersByType: (type) => get().banners.filter((b) => b.type === type),
}));
