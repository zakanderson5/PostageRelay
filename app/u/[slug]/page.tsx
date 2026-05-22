import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SendMessageForm from "./SendMessageForm";

export default async function BondPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const page = await prisma.bondPage.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!page) notFound();

  const min = (page.minBondCents / 100).toFixed(2);
  const max = (page.maxBondCents / 100).toFixed(2);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        {page.displayName ?? page.user.name ?? page.slug}
      </h1>

      {page.headline && <p style={{ marginTop: 8 }}>{page.headline}</p>}

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div><b>Minimum bond:</b> ${min}</div>
        {page.allowBoost ? <div><b>Max bond:</b> ${max}</div> : null}
        <div><b>Delivery fee:</b> $0.99</div>
        <div><b>Timeout:</b> {page.timeoutHours} hours</div>
      </div>

      {searchParams.sent ? (
        <p style={{ marginTop: 16, padding: 12, background: "#e8fff0", border: "1px solid #b7f5cc", borderRadius: 10 }}>
          ✅ Message saved to DB (payments next).
        </p>
      ) : null}

      <h2 style={{ marginTop: 24, fontSize: 20, fontWeight: 700 }}>Send a message</h2>

      <SendMessageForm slug={page.slug} allowBoost={page.allowBoost} min={min} max={max} />

      {page.instructions ? <p style={{ marginTop: 16, color: "#444" }}>{page.instructions}</p> : null}
    </main>
  );
}
