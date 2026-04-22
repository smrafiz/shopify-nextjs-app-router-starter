// Base props all components should accept
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

// Modal props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
}
