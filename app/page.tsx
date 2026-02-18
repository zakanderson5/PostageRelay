import Link from "next/link";
import TopNav from "./_components/TopNav";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />

      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "36px 16px 60px" }}>
        <div style={{ padding: "26px 18px", border: "1px solid #222", borderRadius: 16 }}>
          <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.05 }}>
            Make inbound email respectful.
          </div>

          <p style={{ marginTop: 14, fontSize: 18, opacity: 0.85, maxWidth: 720, lineHeight: 1.5 }}>
            PostageRelay lets businesses publish a link (or forward a domain inbox) that requires a refundable bond.
            If you accept the message, you get paid. If you release or ignore it, the sender gets refunded (minus any fee you set).
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
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

            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #222",
                textDecoration: "none",
                color: "inherit",
                opacity: 0.9,
                fontWeight: 700,
              }}
            >
              Log in
            </Link>

            <Link
              href="/how-it-works"
              style={{
                display: "inline-block",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #222",
                textDecoration: "none",
                color: "inherit",
                opacity: 0.9,
                fontWeight: 700,
              }}
            >
              See how it works
            </Link>
          </div>

          <p style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
            Built for businesses: support@, sales@, partnerships@, recruiting@.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 18 }}>
          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 900 }}>How it works</div>
            <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
              1) You publish a link (or forward a domain inbox).
              <br />
              2) Senders post a refundable bond to contact you.
              <br />
              3) You accept to get paid, or release/ignore to refund.
            </div>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 900 }}>Domain routing</div>
            <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
              Own your domain? Forward a public inbox like hello@yourcompany.com into PostageRelay.
              Your onboarding page already shows the forwarding address format.
            </div>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 900 }}>Manage everything</div>
            <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
              After you log in, you can edit settings like your display name, minimum bond, and account details on the settings page.
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/settings" style={{ textDecoration: "none", color: "inherit", opacity: 0.9, fontWeight: 700 }}>
                Go to settings →
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap", opacity: 0.8, fontSize: 13 }}>
          <Link href="/privacy" style={{ textDecoration: "none", color: "inherit" }}>
            Privacy
          </Link>
          <Link href="/terms" style={{ textDecoration: "none", color: "inherit" }}>
            Terms
          </Link>
          <Link href="/contact" style={{ textDecoration: "none", color: "inherit" }}>
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
