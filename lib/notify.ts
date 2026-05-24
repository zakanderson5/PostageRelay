import { Resend } from "resend";
import { makeReviewUrl } from "@/lib/signedLinks";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBond(cents: number | undefined): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents) || cents <= 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTimeoutFromExpiry(expiresAt: Date): string | null {
  const ms = expiresAt.getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours <= 0) return null;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export async function notifyReceiver(params: {
  to: string;
  senderEmail: string;
  subject: string | null;
  body: string;
  publicId: string;
  expiresAt: Date;
  attachmentCount?: number;
  bondCents?: number;
}) {
  const expUnix = Math.floor(params.expiresAt.getTime() / 1000);
  const reviewUrl = makeReviewUrl(params.publicId, expUnix);
  const attachmentCount = Math.max(0, Math.floor(params.attachmentCount ?? 0));
  const bondLabel = formatBond(params.bondCents);
  const timeoutLabel = formatTimeoutFromExpiry(params.expiresAt);
  const subjectText = params.subject?.trim() || "(no subject)";

  // Email subject: clearer, value-forward
  const emailSubject = bondLabel
    ? `${bondLabel} deposit pending review — ${subjectText}`
    : `New paid message: ${subjectText}`;

  // Dev fallback if no email provider configured.
  // Do NOT log the signed review URL — it grants access to the message.
  if (!process.env.RESEND_API_KEY) {
    console.log("[DEV] notifyReceiver: RESEND_API_KEY not set; skipping send", {
      publicId: params.publicId,
      attachmentCount,
    });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "GatePost Inbox <onboarding@resend.dev>";

  const safeFrom = escapeHtml(params.senderEmail);
  const safeSubject = escapeHtml(subjectText);
  const safeBody = escapeHtml(params.body);
  const safeUrl = escapeHtml(reviewUrl);

  const metaRows: string[] = [];
  if (bondLabel) {
    metaRows.push(
      `<tr><td style="padding:4px 0;color:#666;font-size:13px;">Refundable deposit</td><td style="padding:4px 0;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(bondLabel)}</td></tr>`,
    );
  }
  if (timeoutLabel) {
    metaRows.push(
      `<tr><td style="padding:4px 0;color:#666;font-size:13px;">Decide within</td><td style="padding:4px 0;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(timeoutLabel)}</td></tr>`,
    );
  }

  const attachmentBlock =
    attachmentCount > 0
      ? `
        <div style="margin-top:14px;padding:10px 12px;border:1px solid #f1d089;background:#fff8e6;border-radius:8px;font-size:13px;color:#5a3a00;line-height:1.5;">
          📎 This message includes ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}.
          Attachments were uploaded by an unverified sender. Open with normal care &mdash;
          never run executables. Open attachments only after you have decided to accept.
        </div>
      `
      : "";

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f5f6f9; padding:24px 12px; color:#111;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e8ee;border-radius:14px;overflow:hidden;">
        <div style="padding:18px 22px;border-bottom:1px solid #eef0f5;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#666;font-weight:700;">
          GatePost Inbox
        </div>

        <div style="padding:22px;">
          <h1 style="margin:0 0 6px;font-size:20px;font-weight:800;">New paid message pending review</h1>
          <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.5;">
            A sender has authorized a refundable deposit to reach you. Review the message and
            choose to accept or release.
          </p>

          <table style="width:100%;border-collapse:collapse;margin:6px 0 12px;">
            <tr>
              <td style="padding:4px 0;color:#666;font-size:13px;">From</td>
              <td style="padding:4px 0;font-size:13px;font-weight:600;text-align:right;">${safeFrom}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#666;font-size:13px;">Subject</td>
              <td style="padding:4px 0;font-size:13px;font-weight:600;text-align:right;">${safeSubject}</td>
            </tr>
            ${metaRows.join("")}
          </table>

          <div style="margin-top:8px;padding:12px 14px;border:1px solid #e6e8ee;background:#fafbfc;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.5;color:#222;">${safeBody}</div>

          ${attachmentBlock}

          <div style="margin-top:20px;text-align:center;">
            <a href="${safeUrl}"
               style="display:inline-block;padding:12px 20px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:700;font-size:14px;">
              Open message — accept or refund
            </a>
          </div>

          <p style="margin:18px 0 0;font-size:12px;color:#777;line-height:1.5;text-align:center;">
            You decide if and when to accept. If you release, ignore, or the deposit expires,
            the sender is refunded automatically.
          </p>
        </div>
      </div>

      <p style="max-width:560px;margin:14px auto 0;font-size:11px;color:#999;text-align:center;line-height:1.5;">
        You are receiving this because a sender used your GatePost link.
        Manage your inbox at gatepostinbox.com.
      </p>
    </div>
  `;

  const textLines: string[] = [
    "GatePost Inbox — new paid message pending review",
    "",
    `From: ${params.senderEmail}`,
    `Subject: ${subjectText}`,
  ];
  if (bondLabel) textLines.push(`Refundable deposit: ${bondLabel}`);
  if (timeoutLabel) textLines.push(`Decide within: ${timeoutLabel}`);
  textLines.push("", "Message:", params.body, "");
  if (attachmentCount > 0) {
    textLines.push(
      `This message includes ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}. Open with normal care.`,
      "",
    );
  }
  textLines.push(
    "Open message — accept or refund:",
    reviewUrl,
    "",
    "If you release, ignore, or the deposit expires, the sender is refunded automatically.",
  );
  const text = textLines.join("\n");

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: emailSubject,
    replyTo: params.senderEmail,
    html,
    text,
  });

  if (error) {
    console.error("Resend send error");
    return;
  }

  console.log("notifyReceiver: sent", { id: data?.id ?? null });
}
