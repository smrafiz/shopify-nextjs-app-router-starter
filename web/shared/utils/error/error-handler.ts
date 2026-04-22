/**
 * Error Handling Utilities
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    this.name = "AppError";
  }
}
