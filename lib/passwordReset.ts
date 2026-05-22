import "server-only";
import crypto from "crypto";

export const RESET_TOKEN_TTL_MINUTES = 45;

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function resetTokenExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}
