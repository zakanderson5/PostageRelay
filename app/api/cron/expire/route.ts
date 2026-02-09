import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
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

      // Only capturable intents can be partially captured
      if (pi.status !== "requires_capture") {
        skipped++;
        continue;
      }

      // Capture delivery fee only; remainder is released automatically
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
      // Leave it for next run
      skipped++;
    }
  }

  return Response.json({ checked: due.length, expired, skipped });
}
