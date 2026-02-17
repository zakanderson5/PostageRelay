export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();
  const x = req.headers.get("x-inbound-secret");
  if (x) return x.trim();
  return null;
}

export async function POST(req: Request) {
  const expected = process.env.INBOUND_WEBHOOK_SECRET?.trim();
  if (!expected) {
    console.error("INBOUND_WEBHOOK_SECRET missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const got = getToken(req);
  if (!got || got !== expected) {
    console.warn("Inbound unauthorized");
    return new Response("Unauthorized", { status: 401 });
  }

  // For now just log payload size so you can confirm delivery end-to-end.
  // Next step: parse payload, map recipient -> page, create message, email sender checkout link.
  const raw = await req.text();
  console.log("Inbound email webhook hit", { bytes: raw.length });

  return new Response("ok", { status: 200 });
}
