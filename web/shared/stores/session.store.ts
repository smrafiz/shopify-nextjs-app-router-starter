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
    /** The raw App Bridge session token (JWT). */
    sessionToken: string | null;
    /** @deprecated Use sessionToken !== null. Kept for backward compatibility. */
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
    updateSessionToken: (token: string) => void;
    clearSession: () => void;
    reset: () => void;
    validateSession: () => Promise<void>;
    retryValidation: () => Promise<void>;
    /** Returns true if lastValidated is older than 5 minutes. */
    isSessionExpired: () => boolean;
}

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

const initialState: SessionState = {
    shop: null,
    host: null,
    isInitialized: false,
    hasValidSession: false,
    sessionToken: null,
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
            sessionToken: null,
            hasToken: false,
            sessionError: error,
            lastValidated: new Date(),
        }),

    updateSessionToken: (token) =>
        set({
            sessionToken: token,
            hasToken: true,
            hasValidSession: true,
            lastValidated: new Date(),
        }),

    clearSession: () =>
        set({
            hasValidSession: false,
            sessionToken: null,
            hasToken: false,
            sessionError: null,
            lastValidated: null,
        }),

    reset: () => set(initialState),

    isSessionExpired: () => {
        const { lastValidated } = get();
        if (!lastValidated) return true;
        return Date.now() - lastValidated.getTime() > SESSION_TTL_MS;
    },

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
                        store.sessionValidationFailed(
                            data.error || "Session validation failed",
                        );
                    }
                } else {
                    store.sessionValidationFailed("Server validation failed");
                }
            } else {
                store.sessionValidationFailed("App Bridge not available");
            }
        } catch (error) {
            store.sessionValidationFailed(
                error instanceof Error
                    ? error.message
                    : "Session validation failed",
            );
        }
    },

    retryValidation: async () => get().validateSession(),
}));
