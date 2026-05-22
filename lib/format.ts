export function centsToUsd(cents: number | null | undefined, currency = "usd"): string {
  const n = typeof cents === "number" ? cents : 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const dollars = (abs / 100).toFixed(2);
  const symbol = currency.toLowerCase() === "usd" ? "$" : "";
  return `${sign}${symbol}${dollars}`;
}

export function maskAccountId(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 7)}…${id.slice(-4)}`;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AUTHORIZING: "Authorizing",
  AUTHORIZED: "Awaiting review",
  ACCEPTED: "Accepted",
  RELEASED: "Released",
  EXPIRED: "Expired",
  FAILED: "Failed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  switch (status) {
    case "AUTHORIZED":
      return "#f0b429";
    case "ACCEPTED":
      return "#3ddc84";
    case "RELEASED":
      return "#6aa9ff";
    case "EXPIRED":
      return "#9aa3ad";
    case "FAILED":
      return "#ef4444";
    default:
      return "#9aa3ad";
  }
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeFromNow(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const mins = Math.round(absMs / 60000);
  const future = diffMs > 0;
  if (mins < 60) return future ? `in ${mins}m` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return future ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return future ? `in ${days}d` : `${days}d ago`;
}

export function truncate(s: string | null | undefined, max = 80): string {
  const v = (s ?? "").trim();
  if (v.length <= max) return v;
  return `${v.slice(0, max - 1)}…`;
}
