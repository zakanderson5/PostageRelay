export const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export const INLINE_PREVIEW_TYPES = new Set<string>([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export const MAX_FILES_PER_MESSAGE = 3;
export const MAX_TOTAL_BYTES_PER_MESSAGE = 10 * 1024 * 1024; // 10 MB
export const MAX_SINGLE_FILE_BYTES = MAX_TOTAL_BYTES_PER_MESSAGE;
export const ORPHAN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export const PRE_PAYMENT_STATUSES = ["DRAFT", "AUTHORIZING"] as const;
export const RECEIVER_VISIBLE_STATUSES = [
  "AUTHORIZED",
  "ACCEPTED",
  "RELEASED",
  "EXPIRED",
] as const;

export function isAllowedContentType(ct: string): ct is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(ct);
}

export function isReceiverVisibleStatus(status: string): boolean {
  return (RECEIVER_VISIBLE_STATUSES as readonly string[]).includes(status);
}

export function isPrePaymentStatus(status: string): boolean {
  return (PRE_PAYMENT_STATUSES as readonly string[]).includes(status);
}

const SAFE_FILENAME_RE = /[^\w.\-() ]+/g;
export function sanitizeFilename(input: string, max = 180): string {
  const noPath = input.replace(/[\\/]+/g, "_").replace(/\.\.+/g, ".");
  const ascii = noPath
    .normalize("NFKD")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(SAFE_FILENAME_RE, "_")
    .trim();
  const cleaned = ascii.length > 0 ? ascii : "file";
  return cleaned.slice(0, max);
}

export function buildStorageKey(publicId: string, originalFileName: string): string {
  const safe = sanitizeFilename(originalFileName, 120);
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `messages/${publicId}/${rand}-${safe}`;
}

export type AttachmentDescriptor = {
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export type BatchValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateBatchAddition(
  existing: { sizeBytes: number }[],
  incoming: AttachmentDescriptor[],
): BatchValidationResult {
  if (incoming.length === 0) return { ok: true };

  if (existing.length + incoming.length > MAX_FILES_PER_MESSAGE) {
    return { ok: false, error: `Maximum ${MAX_FILES_PER_MESSAGE} files per message.` };
  }

  let total = existing.reduce((sum, a) => sum + a.sizeBytes, 0);
  for (const f of incoming) {
    if (!Number.isFinite(f.sizeBytes) || f.sizeBytes <= 0) {
      return { ok: false, error: `Invalid file size for ${f.filename}.` };
    }
    if (f.sizeBytes > MAX_SINGLE_FILE_BYTES) {
      return { ok: false, error: `File ${f.filename} exceeds the 10 MB limit.` };
    }
    if (!isAllowedContentType(f.contentType)) {
      return { ok: false, error: `File type not allowed: ${f.contentType}` };
    }
    total += f.sizeBytes;
    if (total > MAX_TOTAL_BYTES_PER_MESSAGE) {
      return { ok: false, error: "Combined attachment size exceeds 10 MB." };
    }
  }
  return { ok: true };
}
