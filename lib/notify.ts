import { Resend } from "resend";
import { makeReviewUrl } from "@/lib/signedLinks";

export async function notifyReceiver(params: {
  to: string;
  senderEmail: string;
  subject: string | null;
  body: string;
  publicId: string;
  expiresAt: Date;
}) {
  const expUnix = Math.floor(params.expiresAt.getTime() / 1000);
  const reviewUrl = makeReviewUrl(params.publicId, expUnix);

  // Dev fallback if no email provider configured
  if (!process.env.RESEND_API_KEY) {
    console.log("\n📩 [DEV] Receiver notification email would be sent:");
    console.log("To:", params.to);
    console.log("Review:", reviewUrl);
    console.log("From:", params.senderEmail);
    console.log("Subject:", params.subject ?? "(none)");
    console.log("—\n");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "Postage Relay <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `[Postage Relay] New message from ${params.senderEmail}`,
    replyTo: params.senderEmail,
    html: `
      <div style="font-family: system-ui;">
        <h2>Postage Relay: New message</h2>
        <p><b>From:</b> ${params.senderEmail}</p>
        <p><b>Subject:</b> ${params.subject ?? "(none)"}</p>
        <pre style="white-space: pre-wrap; padding: 12px; border: 1px solid #ddd;">${params.body}</pre>
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
