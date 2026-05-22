import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, getUserIdFromToken } from "@/lib/auth";
import ReceiverNav from "@/app/_components/ReceiverNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const userId = token ? await getUserIdFromToken(token) : null;
  if (!userId) redirect("/login?next=/dashboard");

  return (
    <>
      <ReceiverNav />
      {children}
    </>
  );
}
