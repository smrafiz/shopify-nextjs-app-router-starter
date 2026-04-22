import { formatCurrency } from "./currency";

export type MetricFormat = "currency" | "percentage" | "number";

/**
 * Format a metric value based on its display type
 */
export function formatByType(value: number, format: MetricFormat): string {
    switch (format) {
        case "currency":
            if (Math.abs(value) >= 1_000_000) {
                return `$${(value / 1_000_000).toFixed(1)}M`;
            }
            if (Math.abs(value) >= 1_000) {
                return `$${(value / 1_000).toFixed(1)}K`;
            }
            return formatCurrency(Math.round(value));
        case "percentage":
            return `${Math.round(value)}%`;
        case "number":
        default:
            return value?.toLocaleString();
    }
}
