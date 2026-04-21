import { create } from "zustand";
import { Announcement } from "../types";

interface AnnouncementStore {
  selectedId: string | null;
  isFormOpen: boolean;
  setSelected: (id: string | null) => void;
  openForm: (announcement?: Announcement) => void;
  closeForm: () => void;
}

export const useAnnouncementStore = create<AnnouncementStore>((set) => ({
  selectedId: null,
  isFormOpen: false,
  setSelected: (id) => set({ selectedId: id }),
  openForm: (announcement) => set({ selectedId: announcement?.id ?? null, isFormOpen: true }),
  closeForm: () => set({ selectedId: null, isFormOpen: false }),
}));
