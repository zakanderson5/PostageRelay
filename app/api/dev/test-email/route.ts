import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to");

  if (!process.env.RESEND_API_KEY) {
    return new Response("Missing RESEND_API_KEY in .env", { status: 500 });
  }
  if (!to) return new Response("Provide ?to=you@example.com", { status: 400 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "BondMail <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "PostageRelay email test ✅",
    html: "<p>If you got this, Resend is wired correctly.</p>",
  });

  if (error) return Response.json({ ok: false, error }, { status: 500 });
  return Response.json({ ok: true, id: data?.id });
}
