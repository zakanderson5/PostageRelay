import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import SettingsForm from "./settings-form";

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

  return (
    <SettingsForm
      initial={{
        email: user.email,
        stripeAccountId: user.stripeAccountId ?? "",
        stripeOnboarded: user.stripeOnboarded ?? false,
        slug: user.bondPage.slug,
        displayName: user.bondPage.displayName ?? "",
        minBondCents: user.bondPage.minBondCents ?? 599,
      }}
    />
  );
}
