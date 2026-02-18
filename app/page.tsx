import Link from "next/link";
import TopNav from "./_components/TopNav";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />

      <div className="container" style={{ paddingTop: 18 }}>
        <section className="hero">
          <div className="kicker">Pay-to-reach inbox • Built for businesses</div>

          <h1 className="h1">Make inbound email respectful.</h1>

          <p className="lead">
            PostageRelay lets businesses publish a link (or forward a domain inbox) that requires a refundable bond.
            If you accept the message, you get paid. If you release or ignore it, the sender gets refunded (minus any fee you set).
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <Link href="/start" className="btn btnPrimary">Create your inbox</Link>
            <Link href="/login" className="btn">Log in</Link>
            <Link href="/how-it-works" className="btn">See how it works</Link>
          </div>

          <div className="chips">
            <span className="chip">Stripe-held funds</span>
            <span className="chip">Domain forwarding</span>
            <span className="chip">No subscription</span>
            <span className="chip">You control access</span>
          </div>

          <p style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
            Built for businesses: support@, sales@, partnerships@, recruiting@.
          </p>
        </section>

        <section className="grid">
          <div className="card">
            <div className="cardTitle">How it works</div>
            <div className="cardBody">
              1) You publish a link (or forward a domain inbox).<br/>
              2) Senders post a refundable bond to contact you.<br/>
              3) You accept to get paid, or release/ignore to refund.
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Domain routing</div>
            <div className="cardBody">
              Own your domain? Forward a public inbox like hello@yourcompany.com into PostageRelay.
              Your onboarding page already shows the forwarding address format.
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Manage everything</div>
            <div className="cardBody">
              After you log in, you can edit settings like your display name, minimum bond, and account details.
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/settings" style={{ fontWeight: 900, color: "var(--text)" }}>
                Go to settings →
              </Link>
            </div>
          </div>
        </section>

        <footer className="footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      </div>
    </main>
  );
}
