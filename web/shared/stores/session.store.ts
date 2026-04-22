import { create } from "zustand";

interface AppBridge {
    idToken(): Promise<string | null>;
}
declare global {
    interface Window {
        __APP_BRIDGE__?: AppBridge;
    }
}

export interface SessionState {
    shop: string | null;
    host: string | null;
    isInitialized: boolean;
    hasValidSession: boolean;
    hasToken: boolean;
    isValidating: boolean;
    sessionError: string | null;
    lastValidated: Date | null;
}

export interface SessionStore extends SessionState {
    setParams: (shop: string | null, host: string | null) => void;
    startSessionValidation: () => void;
    sessionValidationSuccess: (shop?: string) => void;
    sessionValidationFailed: (error: string) => void;
    clearSession: () => void;
    reset: () => void;
    validateSession: () => Promise<void>;
    retryValidation: () => Promise<void>;
}

const initialState: SessionState = {
    shop: null,
    host: null,
    isInitialized: false,
    hasValidSession: false,
    hasToken: false,
    isValidating: true,
    sessionError: null,
    lastValidated: null,
};

export const useSessionStore = create<SessionStore>()((set, get) => ({
    ...initialState,

    setParams: (shop, host) => set({ shop, host, isInitialized: true }),

    startSessionValidation: () => set({ isValidating: true, sessionError: null }),

    sessionValidationSuccess: (shop) =>
        set((state) => ({
            isValidating: false,
            hasValidSession: true,
            hasToken: true,
            shop: shop ?? state.shop,
            sessionError: null,
            lastValidated: new Date(),
        })),

    sessionValidationFailed: (error) =>
        set({
            isValidating: false,
            hasValidSession: false,
            hasToken: false,
            sessionError: error,
            lastValidated: new Date(),
        }),

    clearSession: () =>
        set({
            hasValidSession: false,
            hasToken: false,
            sessionError: null,
            lastValidated: null,
        }),

    reset: () => set(initialState),

    validateSession: async () => {
        const store = get();
        try {
            store.startSessionValidation();

            if (typeof window !== "undefined" && window.__APP_BRIDGE__) {
                const app = window.__APP_BRIDGE__;
                const token = await app.idToken();

                if (!token) {
                    store.sessionValidationFailed("No session token available");
                    return;
                }

                const response = await fetch("/api/session/validate", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.valid) {
                        store.sessionValidationSuccess(data.shop);
                    } else {
                        store.sessionValidationFailed(data.error || "Session validation failed");
                    }
                } else {
                    store.sessionValidationFailed("Server validation failed");
                }
            } else {
                store.sessionValidationFailed("App Bridge not available");
            }
        } catch (error) {
            store.sessionValidationFailed(
                error instanceof Error ? error.message : "Session validation failed",
            );
        }
    },

    retryValidation: async () => get().validateSession(),
}));
