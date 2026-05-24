import TopNav from "../_components/TopNav";
import Link from "next/link";

type QA = { q: string; a: React.ReactNode };

const QAS: QA[] = [
  {
    q: "Who is GatePost for?",
    a: "Independent consultants, coaches, fractional operators, and experts whose inbox has become a job. Anyone whose time is regularly burned by unpaid 'quick questions,' cold outreach, or bad-fit requests.",
  },
  {
    q: "Is this a paywall?",
    a: "No. It's a refundable deposit for priority review. You can keep your normal contact form, email, and DMs. GatePost is an additional 'serious only' lane &mdash; not a replacement.",
  },
  {
    q: "Is this escrow?",
    a: "No. GatePost is not an escrow agent, bank, fiduciary, or money transmitter. Stripe authorizes a hold on the sender's card; funds only move when you accept the message. Card details are handled by Stripe, not by GatePost.",
  },
  {
    q: "Is the deposit really refundable?",
    a: "Yes. If you release the message, ignore it, or the timeout expires, the deposit is released back to the sender on the card / bank's standard timeline (typically 5–10 business days). Only the $0.99 delivery fee is non-refundable once the message is delivered for your review.",
  },
  {
    q: "What is the $0.99 delivery fee?",
    a: "A small non-refundable fee charged once your message is delivered for the receiver to review. It covers payment processing and email delivery. It is separate from the refundable deposit and is captured regardless of whether the receiver accepts, releases, or ignores the message.",
  },
  {
    q: "What happens if the receiver ignores the message?",
    a: "After the timeout window expires, the deposit is automatically released back to the sender. Only the $0.99 delivery fee remains captured. The sender does not need to take any action.",
  },
  {
    q: "What happens if the receiver accepts?",
    a: "The deposit is captured. The receiver gets 80% paid out to their connected Stripe account on Stripe's standard payout schedule. GatePost keeps 20% of the deposit plus the $0.99 delivery fee. No subscriptions, no per-seat fees.",
  },
  {
    q: "How do receivers get paid?",
    a: "During onboarding, the receiver connects a Stripe account (Stripe Connect). When a message is accepted, Stripe pays out the receiver's share according to Stripe's standard schedule for the receiver's country.",
  },
  {
    q: "Can senders dispute a charge?",
    a: "Yes &mdash; senders can dispute card charges through their card issuer just like any other transaction. We recommend contacting support first; most issues are resolvable quickly. Repeated disputes can lead to account suspension and may affect the receiver's Stripe payouts.",
  },
  {
    q: "Can I keep my normal contact form?",
    a: "Yes &mdash; that's the recommended setup. Keep your regular email or contact form for everyday inquiries, and use your GatePost link as a priority lane for inbound that needs to skip the queue.",
  },
  {
    q: "Are attachments safe?",
    a: "Attachments are optional and limited in size and file type (PDF, PNG, JPG, TXT, DOCX). Files are stored privately and only the receiver can download them via an auth-gated link. As with any inbox, treat unknown attachments with normal care &mdash; never run executables, scan if unsure.",
  },
  {
    q: "Does GatePost read my messages?",
    a: "We do not read message contents as a normal practice. Messages are stored to deliver and display them to the intended receiver. We may access content only as needed to investigate abuse, comply with law, or fix a technical issue you report.",
  },
  {
    q: "Can senders see my private email?",
    a: "The sender sees your public GatePost link and your display name. Your private email is used to notify you of new messages but is not exposed on the public sender page.",
  },
  {
    q: "Do I have to respond to every message?",
    a: "No. Acceptance is entirely your discretion. Doing nothing simply releases the deposit when the timeout expires.",
  },
  {
    q: "Do I need Stripe?",
    a: "Yes &mdash; to receive payouts when you accept messages, you connect a Stripe account during onboarding.",
  },
];

export default function FaqPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        <section className="hero">
          <div className="kicker">FAQ</div>
          <h1 className="h1" style={{ fontSize: 44 }}>Frequently asked questions</h1>
          <p className="lead">
            Plain-English answers about how GatePost works for receivers and senders.
          </p>
        </section>

        <section style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {QAS.map((item, i) => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div className="cardTitle" style={{ fontSize: 17 }}>{item.q}</div>
              <div className="cardBody">
                {typeof item.a === "string" ? (
                  <span dangerouslySetInnerHTML={{ __html: item.a }} />
                ) : (
                  item.a
                )}
              </div>
            </div>
          ))}
        </section>

        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/start" className="btn btnPrimary">Create your inbox</Link>
          <Link href="/pricing" className="btn">Pricing</Link>
          <Link href="/contact" className="btn">Contact</Link>
        </div>
      </div>
    </main>
  );
}
