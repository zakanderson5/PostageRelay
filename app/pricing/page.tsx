import TopNav from "../_components/TopNav";
import Link from "next/link";

type Example = {
  bond: number;
};

const EXAMPLES: Example[] = [{ bond: 25 }, { bond: 100 }, { bond: 500 }];
const DELIVERY_FEE = 0.99;
const RECEIVER_SHARE = 0.8;
const PLATFORM_SHARE = 0.2;

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function PricingPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        <section className="hero">
          <div className="kicker">Pricing</div>
          <h1 className="h1" style={{ fontSize: 44 }}>Simple, transparent, refundable</h1>
          <p className="lead">
            Senders authorize a refundable deposit plus a small non-refundable delivery fee.
            When you accept, you receive 80% of the deposit. If you release, ignore, or the
            timeout expires, the deposit is released back to the sender.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <div className="kicker">The economics</div>
          <h2 className="h1" style={{ fontSize: 30 }}>How each message breaks down</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">Delivery fee</div>
              <div className="cardBody">
                <b>$0.99</b> per delivered message. Non-refundable once the message is delivered
                for your review. Covers payment processing and email delivery.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Receiver share (you)</div>
              <div className="cardBody">
                <b>80%</b> of the accepted deposit is paid out to your connected Stripe account.
                You do not receive the delivery fee.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">GatePost platform share</div>
              <div className="cardBody">
                <b>20%</b> of the accepted deposit, plus the $0.99 delivery fee. That&apos;s the only
                way GatePost makes money &mdash; no subscriptions, no per-seat fees.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">If released, ignored, or expired</div>
              <div className="cardBody">
                Only the $0.99 delivery fee is captured. The deposit is released back to the
                sender on the standard card/bank timeline (typically 5–10 business days).
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="kicker">Worked examples</div>
          <h2 className="h1" style={{ fontSize: 30 }}>What a sender sees, what you keep</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            {EXAMPLES.map((ex) => {
              const auth = ex.bond + DELIVERY_FEE;
              const receiverPayout = ex.bond * RECEIVER_SHARE;
              const platformShare = ex.bond * PLATFORM_SHARE + DELIVERY_FEE;
              return (
                <div key={ex.bond} className="card" style={{ padding: 18 }}>
                  <div className="cardTitle">{money(ex.bond)} deposit</div>
                  <div className="cardBody" style={{ lineHeight: 1.7 }}>
                    <div><b>Sender authorizes:</b> {money(auth)} hold ({money(ex.bond)} deposit + {money(DELIVERY_FEE)} delivery fee)</div>
                    <div style={{ marginTop: 8 }}>
                      <b>If you accept:</b><br />
                      &nbsp;&nbsp;You receive {money(receiverPayout)} (80% of deposit)<br />
                      &nbsp;&nbsp;GatePost keeps {money(platformShare)} (20% of deposit + {money(DELIVERY_FEE)} delivery fee)
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <b>If released / ignored / expired:</b><br />
                      &nbsp;&nbsp;Only {money(DELIVERY_FEE)} delivery fee is captured<br />
                      &nbsp;&nbsp;{money(ex.bond)} deposit is released back to the sender
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="kicker">Important details</div>
          <div className="grid" style={{ marginTop: 8 }}>
            <div className="card">
              <div className="cardTitle">Payouts</div>
              <div className="cardBody">
                Payouts arrive in your bank account on Stripe&apos;s standard schedule for your
                country (typically 2 business days for US accounts after Stripe&apos;s payout cycle).
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Refund timing</div>
              <div className="cardBody">
                When the deposit is released, it usually returns to the sender&apos;s card within
                5–10 business days, depending on the card issuer.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Stripe processing fees</div>
              <div className="cardBody">
                Standard Stripe processing fees apply to captured funds. Payout amounts you see
                in your Stripe dashboard reflect those fees.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Taxes</div>
              <div className="cardBody">
                You are responsible for any taxes on payouts you receive. GatePost does not
                provide tax advice &mdash; consult your accountant.
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/start" className="btn btnPrimary">Create your inbox</Link>
          <Link href="/faq" className="btn">Read FAQ</Link>
          <Link href="/how-it-works" className="btn">How it works</Link>
        </div>
      </div>
    </main>
  );
}
