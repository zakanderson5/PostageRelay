import TopNav from "../_components/TopNav";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        <section className="hero">
          <div className="kicker">How it works</div>
          <h1 className="h1" style={{ fontSize: 44 }}>A refundable deposit for inbox access</h1>
          <p className="lead">
            Senders authorize a hold on their card &mdash; not an immediate charge. You review
            on your schedule and decide whether to accept (capture the deposit), release
            (refund the sender), or let it expire (auto-refund).
          </p>
        </section>

        {/* 4-STEP FLOW */}
        <section style={{ marginTop: 24 }}>
          <div className="kicker">The four steps</div>
          <h2 className="h1" style={{ fontSize: 30 }}>From link to payout</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            <Step n="1" title="Create your GatePost link" body="Pick a slug, connect Stripe so you can receive payouts, and choose your minimum deposit and timeout window." />
            <Step n="2" title="Sender writes a message and authorizes a deposit" body="They visit your link, write their message, and authorize a refundable hold on their card. Stripe handles the card details &mdash; we never see them." />
            <Step n="3" title="You review the message" body="You're emailed a private review link. Open it when you want. Read the message, see attachments, and decide." />
            <Step n="4" title="Accept, release, or let it expire" body="Accept = deposit is captured and you're paid out (80% of bond to your Stripe account). Release or ignore = deposit is released back to the sender. Only the $0.99 delivery fee is non-refundable." />
          </div>
        </section>

        {/* TWO PERSPECTIVES */}
        <section style={{ marginTop: 28 }}>
          <div className="kicker">Two perspectives</div>
          <h2 className="h1" style={{ fontSize: 30 }}>What each side experiences</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <div className="cardTitle">As a receiver</div>
              <div className="cardBody" style={{ lineHeight: 1.7 }}>
                <div>1. Sign up and connect Stripe.</div>
                <div>2. Set your minimum deposit and timeout window.</div>
                <div>3. Share your link in your bio, signature, or website.</div>
                <div>4. Get notified by email when a sender authorizes a deposit.</div>
                <div>5. Open the secure review link and decide: <b>accept</b>, <b>release</b>, or ignore.</div>
                <div>6. Accepted deposits pay out to your Stripe account on the standard schedule.</div>
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div className="cardTitle">As a sender</div>
              <div className="cardBody" style={{ lineHeight: 1.7 }}>
                <div>1. Open the receiver&apos;s GatePost link.</div>
                <div>2. Write your message and optionally attach files.</div>
                <div>3. Authorize a hold on your card (deposit + $0.99 delivery fee).</div>
                <div>4. Your card is authorized, not yet charged.</div>
                <div>5. If accepted, the deposit is captured. If released, ignored, or expired, the deposit is refunded.</div>
                <div>6. The $0.99 delivery fee is non-refundable once the message is delivered for review.</div>
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section style={{ marginTop: 28 }}>
          <div className="kicker">Timeline</div>
          <h2 className="h1" style={{ fontSize: 30 }}>What happens, and when</h2>

          <div className="card" style={{ marginTop: 16, padding: 18, lineHeight: 1.7 }}>
            <div><b>T + 0:</b> Sender authorizes the deposit on their card. Receiver is notified by email.</div>
            <div style={{ marginTop: 6 }}><b>T + anytime, before timeout:</b> Receiver opens the secure review link and chooses accept or release.</div>
            <div style={{ marginTop: 6 }}><b>T + timeout (set by receiver):</b> If no action is taken, the deposit is released back to the sender automatically.</div>
            <div style={{ marginTop: 6 }}><b>After accept:</b> Receiver&apos;s share (80% of the deposit) is paid out via Stripe Connect on Stripe&apos;s standard schedule.</div>
            <div style={{ marginTop: 6 }}><b>After release / expire:</b> Deposit returns to the sender&apos;s card on the issuer&apos;s standard timeline (typically 5–10 business days).</div>
          </div>
        </section>

        <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/start" className="btn btnPrimary">Create your inbox</Link>
          <Link href="/pricing" className="btn">See pricing</Link>
          <Link href="/faq" className="btn">FAQ</Link>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          {n}
        </div>
        <div className="cardTitle">{title}</div>
      </div>
      <div className="cardBody">{body}</div>
    </div>
  );
}
