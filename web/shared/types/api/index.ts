// Generic API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Server action result
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
