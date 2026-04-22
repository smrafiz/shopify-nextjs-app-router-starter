import { create } from "zustand";

export type ModalType = string | null;

export interface ModalData {
    type: ModalType;
    payload?: unknown;
    loading?: boolean;
    error?: string;
}

export interface ModalState {
    modal: ModalData;
    openModal: (modal: Omit<ModalData, "loading" | "error">) => void;
    closeModal: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useModalStore = create<ModalState>((set) => ({
    modal: { type: null },

    openModal: (modal) => {
        set({ modal: { ...modal, loading: false, error: undefined } });
    },

    closeModal: () => set({ modal: { type: null } }),

    setLoading: (loading) =>
        set((state) => ({
            modal:
                state.modal.type !== null
                    ? { ...state.modal, loading }
                    : state.modal,
        })),

    setError: (error) =>
        set((state) => ({
            modal:
                state.modal.type !== null
                    ? { ...state.modal, error: error || undefined }
                    : state.modal,
        })),
}));
