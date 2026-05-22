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

export async function notifyReceiver(params: {
  to: string;
  senderEmail: string;
  subject: string | null;
  body: string;
  publicId: string;
  expiresAt: Date;
  attachmentCount?: number;
}) {
  const expUnix = Math.floor(params.expiresAt.getTime() / 1000);
  const reviewUrl = makeReviewUrl(params.publicId, expUnix);
  const attachmentCount = Math.max(0, Math.floor(params.attachmentCount ?? 0));
  const attachmentLine =
    attachmentCount > 0
      ? `This message includes ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}. View them from the review link.`
      : null;

  // Dev fallback if no email provider configured
  if (!process.env.RESEND_API_KEY) {
    console.log("\n📩 [DEV] Receiver notification email would be sent:");
    console.log("To:", params.to);
    console.log("Review:", reviewUrl);
    console.log("From:", params.senderEmail);
    console.log("Subject:", params.subject ?? "(none)");
    if (attachmentLine) console.log("Attachments:", attachmentLine);
    console.log("—\n");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "GatePost Inbox <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `[GatePost Inbox] New message from ${params.senderEmail}`,
    replyTo: params.senderEmail,
    html: `
      <div style="font-family: system-ui;">
        <h2>GatePost Inbox: New message</h2>
        <p><b>From:</b> ${escapeHtml(params.senderEmail)}</p>
        <p><b>Subject:</b> ${params.subject != null ? escapeHtml(params.subject) : "(none)"}</p>
        <pre style="white-space: pre-wrap; padding: 12px; border: 1px solid #ddd;">${escapeHtml(params.body)}</pre>
        ${attachmentLine ? `<p>📎 ${escapeHtml(attachmentLine)}</p>` : ""}
        <p><a href="${reviewUrl}">Review + Accept/Release</a></p>
        <p style="color:#666;">Delivery fee is non-refundable. Bond is refundable unless receiver accepts message.</p>
      </div>
    `,
  });

  if (error) {
    console.error("❌ Resend send error:", error);
    return;
  }

  console.log("✅ Resend email sent. id:", data?.id);
}
