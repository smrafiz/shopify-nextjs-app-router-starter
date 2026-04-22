import type { ZodError } from "zod";

export interface ApiError {
    status: "error";
    message: string;
    errors?: string[];
}

/**
 * Handle bundle/resource operation errors
 */
export function handleBundleError(error: unknown): ApiError {
    console.error("[handleBundleError]", error);

    if (error instanceof Error) {
        if (error.message.includes("already exists")) {
            return { status: "error", message: error.message, errors: [error.message] };
        }
        if (error.message.includes("not found")) {
            return { status: "error", message: error.message };
        }
        if (error.message.includes("permission") || error.message.includes("unauthorized")) {
            return { status: "error", message: "You don't have permission to perform this action" };
        }
        if (error.message.includes("validation") || error.message.includes("invalid")) {
            return { status: "error", message: error.message, errors: [error.message] };
        }
        return { status: "error", message: error.message };
    }

    return { status: "error", message: "Operation failed. Please try again." };
}

/**
 * Handle generic API errors
 */
export function handleApiError(
    error: unknown,
    defaultMessage = "Operation failed",
): ApiError {
    console.error("[handleApiError]", error);

    if (error instanceof Error) {
        return {
            status: "error",
            message: error.message || defaultMessage,
            errors: [error.message],
        };
    }

    return { status: "error", message: defaultMessage };
}

/**
 * Handle Zod validation errors
 */
export function handleZodValidationError(zodError: ZodError): ApiError {
    const errors = zodError.issues.map((i) => i.message);
    return { status: "error", message: errors.join(". "), errors };
}

/**
 * Handle general validation errors
 */
export function handleValidationError(error: unknown): ApiError {
    if (error instanceof Error) {
        return { status: "error", message: "Validation failed", errors: [error.message] };
    }
    return { status: "error", message: "Validation failed. Please check your input." };
}

/**
 * Handle Prisma / database errors
 */
export function handleDatabaseError(error: unknown): ApiError {
    console.error("[handleDatabaseError]", error);

    if (error instanceof Error) {
        if (error.message.includes("Unique constraint")) {
            return { status: "error", message: "This record already exists" };
        }
        if (error.message.includes("Foreign key constraint")) {
            return { status: "error", message: "Cannot perform this action due to related records" };
        }
    }

    return { status: "error", message: "Database operation failed. Please try again." };
}

/**
 * Handle transaction errors
 */
export function handleTransactionError(error: unknown): ApiError {
    console.error("[handleTransactionError]", error);
    return { status: "error", message: "Transaction failed. No changes were made." };
}

/**
 * Format error for API response bodies
 */
export function formatErrorResponse(error: unknown, defaultMessage = "An error occurred") {
    if (error instanceof Error) {
        return { error: error.message, details: error.name };
    }
    return { error: defaultMessage, details: "Unknown error" };
}
