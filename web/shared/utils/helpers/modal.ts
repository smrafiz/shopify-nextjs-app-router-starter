import { useModalStore } from "@/shared/stores/modal.store";

export interface QuotaExceededPayload {
    quota: { current: number; limit: number };
    texts: { title: string; message: string; confirmText: string };
}

/**
 * Open quota-exceeded modal with upgrade CTA
 */
export function openQuotaExceededModal(
    quota: { current: number; limit: number },
    texts: { title: string; message: string; confirmText: string },
) {
    useModalStore.getState().openModal({
        type: "quota-exceeded",
        payload: { quota, texts },
    });
}

/**
 * Show modal element overlay (100ms delay for DOM readiness)
 */
export function showModalElement(elementId = "app-modal") {
    setTimeout(() => {
        const el = document.getElementById(elementId) as HTMLElement & {
            showOverlay?: () => void;
        };
        if (el?.showOverlay) {
            el.showOverlay();
        }
    }, 100);
}
