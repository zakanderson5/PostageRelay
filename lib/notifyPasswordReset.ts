import "server-only";

import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBaseUrl(): string {
  const raw =
    (process.env.APP_BASE_URL || "").trim() ||
    (process.env.APP_URL || "").trim() ||
    "https://www.gatepostinbox.com";
  return raw.replace(/\/+$/, "");
}

export function buildResetUrl(rawToken: string): string {
  return `${getBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  rawToken: string;
}): Promise<void> {
  const resetUrl = buildResetUrl(params.rawToken);

  // Dev fallback only (never in production). Logs only the URL, not the token-hash or email body.
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[DEV] Password reset URL (no RESEND_API_KEY set):", resetUrl);
    }
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "GatePost Inbox <onboarding@resend.dev>";

  const safeUrl = escapeHtml(resetUrl);
  const subject = "Reset your GatePost Inbox password";

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">GatePost Inbox</h2>
      <p style="margin: 0 0 16px;">We received a request to reset the password for your GatePost Inbox account.</p>
      <p style="margin: 0 0 20px;">
        <a href="${safeUrl}"
           style="display: inline-block; padding: 10px 16px; border-radius: 8px;
                  background: #111; color: #fff; text-decoration: none; font-weight: 600;">
          Reset your password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #444;">
        Or paste this link into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 13px; word-break: break-all;">
        <a href="${safeUrl}" style="color: #2050c8;">${safeUrl}</a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #666;">
        This link expires in 45 minutes and can only be used once.
      </p>
      <p style="margin: 0; font-size: 13px; color: #666;">
        If you didn't request a password reset, you can safely ignore this email — your password will not change.
      </p>
    </div>
  `;

  const text = [
    "GatePost Inbox",
    "",
    "We received a request to reset the password for your GatePost Inbox account.",
    "",
    "Reset your password:",
    resetUrl,
    "",
    "This link expires in 45 minutes and can only be used once.",
    "If you didn't request a password reset, you can safely ignore this email — your password will not change.",
  ].join("\n");

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
    text,
  });

  if (error) {
    // Generic log only — no token, no email body, no recipient address.
    // eslint-disable-next-line no-console
    console.error("password reset email send failed");
    return;
  }
}
