// Zustand store base
export interface StoreBase {
  reset: () => void;
}

// Banner severity
export type BannerSeverity = "success" | "error" | "warning" | "info";

// Modal payload (generic)
export interface ModalPayload<T = unknown> {
  id: string;
  data?: T;
}
