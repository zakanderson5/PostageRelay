import TopNav from "../_components/TopNav";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18 }}>
        <section className="hero">
          <div className="kicker">Terms</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Terms of service</h1>
          <p className="lead">
            PostageRelay provides a pay‑to‑reach inbox. Senders place funds on hold to contact a receiver. Receivers decide whether to accept or release.
          </p>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <div className="cardTitle">Payments</div>
              <div className="cardBody">
                Funds may be held, captured, or refunded based on receiver actions (accept/release/ignore/expire) and the receiver’s configured fee rules.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Prohibited use</div>
              <div className="cardBody">
                No harassment, unlawful content, malware, or attempts to bypass routing/bond requirements. We may suspend accounts for abuse.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Availability</div>
              <div className="cardBody">
                The service may change or be unavailable at times. We provide the platform “as is” and cannot guarantee delivery or response times.
              </div>
            </div>
          </div>

          <p style={{ marginTop: 16, color: "var(--muted2)", fontSize: 13 }}>
            Questions: support@postagerelay.com
          </p>
        </section>
      </div>
    </main>
  );
}
