import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names with tailwind-merge to avoid conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats date into localized Indian English or Hindi formats.
 */
export function formatDate(
  date: Date | string,
  locale: "hi" | "en" = "hi",
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    ...options,
  }).format(d);
}

/**
 * Formats price in Indian Rupee format (e.g. ₹2,450).
 */
export function formatCurrency(amount: number, locale: "hi" | "en" = "hi"): string {
  return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
