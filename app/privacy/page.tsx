import TopNav from "../_components/TopNav";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18 }}>
        <section className="hero">
          <div className="kicker">Privacy</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Privacy policy</h1>
          <p className="lead">
            This is a plain‑English summary of what GatePost Inbox collects, stores, and shares with vendors needed to run the service.
          </p>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <div className="cardTitle">What we collect</div>
              <div className="cardBody">
                Account info (email, slug), message metadata (sender/receiver, timestamps), and payment metadata needed to hold/refund/capture funds.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">What we share</div>
              <div className="cardBody">
                We use third‑party processors to run the platform (e.g., payments and email delivery). We do not sell personal data.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Retention & deletion</div>
              <div className="cardBody">
                We keep data only as long as needed to operate the service and prevent abuse. You may request deletion by emailing support.
              </div>
            </div>
          </div>

          <p style={{ marginTop: 16, color: "var(--muted2)", fontSize: 13 }}>
            For deletion requests: support@gatepostinbox.com
          </p>
        </section>
      </div>
    </main>
  );
}
