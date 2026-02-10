import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCronToken(req: Request) {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();

  // 2) x-cron-secret: <token>
  const x = req.headers.get("x-cron-secret");
  if (x) return x.trim();

  // 3) fallback: ?secret=<token>
  const url = new URL(req.url);
  const q = url.searchParams.get("secret");
  if (q) return q.trim();

  return null;
}

async function handle(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    console.error("CRON_SECRET is missing in env");
    return new Response("Server misconfigured (missing CRON_SECRET)", { status: 500 });
  }

  const got = getCronToken(req);
  if (!got || got !== expected) {
    console.warn("Cron unauthorized", {
      hasAuthHeader: !!req.headers.get("authorization"),
      hasXCron: !!req.headers.get("x-cron-secret"),
      gotLen: got?.length ?? 0,
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const due = await prisma.message.findMany({
    where: {
      status: "AUTHORIZED",
      expiresAt: { lte: now },
      paymentIntentId: { not: null },
    },
    take: 50,
    orderBy: { expiresAt: "asc" },
  });

  let expired = 0;
  let skipped = 0;

  for (const msg of due) {
    try {
      const pi = await stripe.paymentIntents.retrieve(msg.paymentIntentId!);
      if (pi.status !== "requires_capture") {
        skipped++;
        continue;
      }

      const captured = await stripe.paymentIntents.capture(msg.paymentIntentId!, {
        amount_to_capture: msg.deliveryFeeCents,
      });

      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: "EXPIRED",
          latestChargeId:
            typeof captured.latest_charge === "string" ? captured.latest_charge : null,
        },
      });

      expired++;
    } catch {
      skipped++;
    }
  }

  return Response.json({ checked: due.length, expired, skipped });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
