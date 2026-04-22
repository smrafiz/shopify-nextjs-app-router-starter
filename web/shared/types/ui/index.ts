import type React from "react";

// Generic table column
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Sort direction
export type SortDirection = "asc" | "desc";

// Metric card
export interface MetricData {
  label: string;
  value: number | string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
}
