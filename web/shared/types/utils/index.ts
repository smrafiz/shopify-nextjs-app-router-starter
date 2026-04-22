// Make some fields required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep partial
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Nullable
export type Nullable<T> = T | null;

// ID type
export type ID = string;
