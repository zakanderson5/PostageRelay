import TopNav from "../_components/TopNav";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>How GatePost Inbox works</div>

        <div style={{ marginTop: 14, border: "1px solid #222", borderRadius: 16, padding: 18, lineHeight: 1.6, opacity: 0.9 }}>
          Step 1: Create your GatePost Inbox (pick a link slug).
          <br />
          Step 2: Connect Stripe so you can receive payouts.
          <br />
          Step 3: Publish your link (or forward a domain inbox into GatePost Inbox).
          <br />
          Step 4: When someone messages you, they place a refundable bond at checkout.
          <br />
          Step 5: You choose:
          <br />
          - Accept: capture the bond and pay out to you (after platform fee).
          <br />
          - Release: refund the sender.
          <br />
          - Ignore: the bond expires and refunds automatically (policy depends on your settings).
        </div>

        <div style={{ marginTop: 18 }}>
          <Link
            href="/start"
            style={{
              display: "inline-block",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #333",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 800,
            }}
          >
            Create your inbox
          </Link>
        </div>
      </div>
    </main>
  );
}
