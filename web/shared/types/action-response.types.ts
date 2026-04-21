export type ActionResponse<T = undefined> =
  | { status: "success"; data: T; message?: string }
  | { status: "error"; message: string; errors?: Record<string, string[]> };
