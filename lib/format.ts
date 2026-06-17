import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from "date-fns";

/** $12.00 — accepts dollars (numbers from numeric columns). */
export function currency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** $12 — drops cents when whole, for compact card prices. */
export function currencyCompact(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return Number.isInteger(value) ? `$${value}` : currency(value);
}

export function fromCents(cents: number | null | undefined): string {
  return currency((cents ?? 0) / 100);
}

/** "Jun 17" */
export function shortDate(iso: string): string {
  return format(parseISO(iso), "MMM d");
}

/** "Jun 17, 2026" */
export function longDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

/** "Jun 17 – Jun 21" */
export function dateRange(startIso: string, endIso: string): string {
  return `${shortDate(startIso)} – ${shortDate(endIso)}`;
}

/** Inclusive nights between two yyyy-mm-dd dates. */
export function rentalDays(startIso: string, endIso: string): number {
  return Math.max(differenceInCalendarDays(parseISO(endIso), parseISO(startIso)), 0);
}

/** "3h ago" for chat / activity timestamps. */
export function timeAgo(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
}

/** yyyy-mm-dd for date columns / RPC params. */
export function toDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
