import {
    deleteSessions,
    findSessionsByShop,
} from "./session-storage";

/**
 * App installation helpers — check if a shop has the app installed
 * and clean up sessions on uninstall.
 */
export const AppInstallations = {
    /**
     * Returns true if the shop has an active session with an access token.
     */
    includes: async function (shopDomain: string): Promise<boolean> {
        const sessions = await findSessionsByShop(shopDomain);
        return sessions.some((s) => s.accessToken);
    },

    /**
     * Deletes all sessions for a shop (called on app/uninstalled webhook).
     */
    delete: async function (shopDomain: string): Promise<void> {
        const sessions = await findSessionsByShop(shopDomain);
        if (sessions.length > 0) {
            await deleteSessions(sessions.map((s) => s.id));
        }
    },
};
