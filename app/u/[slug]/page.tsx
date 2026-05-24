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
        <div><b>Minimum deposit:</b> ${min}</div>
        {page.allowBoost ? <div><b>Max deposit:</b> ${max}</div> : null}
        <div><b>Delivery fee:</b> $0.99 (non-refundable once delivered)</div>
        <div><b>Review window:</b> {page.timeoutHours} hours</div>
      </div>

      {/* HOW THIS WORKS FOR YOU */}
      <section
        style={{
          marginTop: 16,
          padding: 14,
          border: "1px solid #d6e8ff",
          background: "#f3f8ff",
          borderRadius: 10,
          lineHeight: 1.6,
          color: "#1a2a44",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>How this works for you</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Your deposit is a <b>payment authorization</b>, not an immediate charge.</li>
          <li>If the receiver <b>accepts</b>, your deposit is captured.</li>
          <li>
            If the receiver <b>releases</b>, <b>ignores</b>, or does not respond within the
            review window, your deposit is released back to your card.
          </li>
          <li>
            The <b>$0.99 delivery fee is non-refundable</b> once your message is delivered for review.
          </li>
          <li><b>Stripe handles card details</b>; GatePost does not store card details.</li>
          <li>Attachments are optional &mdash; please only send safe, relevant files.</li>
        </ul>
      </section>

      {searchParams.sent ? (
        <p style={{ marginTop: 16, padding: 12, background: "#e8fff0", border: "1px solid #b7f5cc", borderRadius: 10 }}>
          ✅ Message saved. Continue to payment to authorize your deposit.
        </p>
      ) : null}

      <h2 style={{ marginTop: 24, fontSize: 20, fontWeight: 700 }}>Send a message</h2>

      <SendMessageForm slug={page.slug} allowBoost={page.allowBoost} min={min} max={max} />

      {page.instructions ? <p style={{ marginTop: 16, color: "#444" }}>{page.instructions}</p> : null}
    </main>
  );
}
