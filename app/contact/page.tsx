import TopNav from "../_components/TopNav";

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18 }}>
        <section className="hero">
          <div className="kicker">Contact</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Get in touch</h1>
          <p className="lead">
            Questions, support requests, or business inquiries — email us and we’ll get back to you.
          </p>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <div className="cardTitle">Support</div>
              <div className="cardBody">
                support@gatepostinbox.com
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Partnerships</div>
              <div className="cardBody">
                partnerships@gatepostinbox.com
              </div>
            </div>
          </div>

          <p style={{ marginTop: 16, color: "var(--muted2)", fontSize: 13 }}>
            Tip: if you’re setting up domain routing and want help, include your domain/provider (Google Workspace, Microsoft 365, etc.).
          </p>
        </section>
      </div>
    </main>
  );
}
