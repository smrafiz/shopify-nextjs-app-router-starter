"use client";

import { useModalStore } from "@/shared/stores/modal.store";

export function ModalProvider() {
    const { modal, closeModal, setLoading, setError } = useModalStore();

    const isOpen = modal.type !== null;

    const handleConfirm = async () => {
        if (!isOpen) return;
        const payload = modal.payload as { onConfirm?: () => Promise<void> } | undefined;
        if (!payload?.onConfirm) {
            closeModal();
            return;
        }

        try {
            setError(null);
            setLoading(true);
            await payload.onConfirm();
            closeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const payload = isOpen
        ? (modal.payload as {
              heading?: string;
              message?: string;
              confirmText?: string;
              cancelText?: string;
              destructive?: boolean;
              onConfirm?: () => Promise<void>;
          } | undefined)
        : undefined;

    return isOpen ? (
        <s-modal
            id="app-modal"
            accessibilityLabel="app modal"
            heading={payload?.heading ?? ""}
            size="base"
        >
            {modal.error && (
                <s-banner tone="critical">
                    <s-text>{modal.error}</s-text>
                </s-banner>
            )}

            {payload?.message && <s-text>{payload.message}</s-text>}

            <s-button
                slot="secondary-actions"
                variant="secondary"
                commandFor="app-modal"
                command="--hide"
                onClick={closeModal}
                disabled={modal.loading}
            >
                {payload?.cancelText ?? "Cancel"}
            </s-button>

            <s-button
                slot="primary-action"
                variant="primary"
                tone={payload?.destructive ? "critical" : undefined}
                onClick={handleConfirm}
                loading={modal.loading}
                disabled={modal.loading}
            >
                {payload?.confirmText ?? "Confirm"}
            </s-button>
        </s-modal>
    ) : null;
}
