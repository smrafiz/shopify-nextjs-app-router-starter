/**
 * Check if the current environment is development
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
}

/**
 * Get environment variable with optional fallback
 */
export function getEnvVar(name: string, fallback: string = ""): string {
    return process.env[name] || fallback;
}
