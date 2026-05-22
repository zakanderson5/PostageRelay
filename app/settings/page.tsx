import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import SettingsForm from "./settings-form";

export const dynamic = "force-dynamic";

type StripeStatus = "ready" | "pending" | "not_connected" | "error_unknown";

async function computeStripeStatus(
  userId: string,
  stripeAccountId: string | null,
  stripeOnboarded: boolean
): Promise<StripeStatus> {
  if (!stripeAccountId) return "not_connected";
  if (stripeOnboarded) return "ready";

  try {
    const acct = await stripe.accounts.retrieve(stripeAccountId);
    const transfers = acct.capabilities?.transfers;
    const isReady =
      acct.details_submitted === true &&
      acct.payouts_enabled === true &&
      transfers === "active";

    if (isReady) {
      await prisma.user
        .update({ where: { id: userId }, data: { stripeOnboarded: true } })
        .catch(() => {});
      return "ready";
    }
    return "pending";
  } catch {
    return "error_unknown";
  }
}

function getPublicBaseUrl() {
  const env =
    (process.env.APP_BASE_URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;
  return "https://www.gatepostinbox.com";
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;

  if (!userId) redirect("/login?next=/settings");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { bondPage: true },
  });

  if (!user) redirect("/start");
  if (!user.bondPage) redirect("/start");

  const [messages, statusGroups, stripeStatus] = await Promise.all([
    prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        publicId: true,
        senderEmail: true,
        senderName: true,
        subject: true,
        bondCents: true,
        deliveryFeeCents: true,
        currency: true,
        status: true,
        authorizedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.message.groupBy({
      by: ["status"],
      where: { receiverId: userId },
      _count: { _all: true },
    }),
    computeStripeStatus(userId, user.stripeAccountId, user.stripeOnboarded),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count._all;
  }

  const publicBaseUrl = getPublicBaseUrl();
  const publicLink = `${publicBaseUrl}/u/${user.bondPage.slug}`;

  return (
    <SettingsForm
      initial={{
        email: user.email,
        stripeAccountId: user.stripeAccountId ?? "",
        stripeStatus,
        slug: user.bondPage.slug,
        displayName: user.bondPage.displayName ?? "",
        minBondCents: user.bondPage.minBondCents ?? 599,
        publicLink,
      }}
      messages={messages.map((m) => ({
        publicId: m.publicId,
        senderEmail: m.senderEmail,
        senderName: m.senderName,
        subject: m.subject,
        bondCents: m.bondCents,
        deliveryFeeCents: m.deliveryFeeCents,
        currency: m.currency,
        status: m.status,
        authorizedAt: m.authorizedAt ? m.authorizedAt.toISOString() : null,
        expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      }))}
      statusCounts={statusCounts}
    />
  );
}
