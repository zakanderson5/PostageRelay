import TopNav from "../_components/TopNav";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        <section className="hero">
          <div className="kicker">Beta privacy</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Privacy (beta)</h1>
          <p className="lead">
            A plain-English summary of what GatePost collects, how we use it, and who helps
            us run the service. This summary is written for clarity, not legal completeness.
          </p>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              border: "1px solid rgba(245, 158, 11, 0.4)",
              background: "rgba(245, 158, 11, 0.08)",
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <b>Beta notice:</b> This beta privacy summary is not a substitute for legal review.
            A full public-launch privacy policy should be reviewed by counsel.
          </div>
        </section>

        <section style={{ marginTop: 22, display: "grid", gap: 12 }}>
          <PrivacyCard title="What we collect">
            <ul style={{ paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
              <li>Account info: email address, hashed password, your chosen slug, display name.</li>
              <li>Message metadata: sender address, receiver, timestamps, message status (authorized / accepted / released / expired).</li>
              <li>Message content and attachments: subject, body text, uploaded files.</li>
              <li>Payment metadata from Stripe: Payment Intent IDs, amounts, currency, payout records. Card details are handled by Stripe and are not stored by GatePost.</li>
              <li>Basic technical data: IP address and request logs needed to operate the service and prevent abuse.</li>
            </ul>
          </PrivacyCard>

          <PrivacyCard title="How we use it">
            To operate the service: deliver messages to receivers, process payment authorization
            and capture via Stripe, notify users by email, and prevent abuse. We do not sell
            personal data.
          </PrivacyCard>

          <PrivacyCard title="Processors we use">
            We rely on the following processors to run the service. Each receives only the data
            it needs to perform its role:
            <ul style={{ paddingLeft: 18, marginTop: 8, lineHeight: 1.7 }}>
              <li><b>Stripe</b> &mdash; payment processing, Stripe Connect payouts.</li>
              <li><b>Resend</b> &mdash; transactional email delivery (notifications, password reset).</li>
              <li><b>Vercel</b> &mdash; hosting and serverless functions.</li>
              <li><b>Vercel Blob</b> &mdash; private storage for message attachments.</li>
              <li><b>Neon / Postgres</b> &mdash; primary database for messages, accounts, and payment metadata.</li>
            </ul>
          </PrivacyCard>

          <PrivacyCard title="Attachments">
            Attachments are stored privately. Only the intended receiver can download them
            through an authenticated, signed link. Raw storage URLs are not exposed publicly.
          </PrivacyCard>

          <PrivacyCard title="Message contents">
            We do not read message contents as a normal practice. Messages are stored to deliver
            and display them to the intended receiver. We may access content only as needed to
            investigate abuse, comply with law, or fix a technical issue you report.
          </PrivacyCard>

          <PrivacyCard title="Retention &amp; deletion">
            We keep account data, messages, and payment metadata as long as needed to operate
            the service, support our users, and meet legal/financial-record requirements.
            During the beta, you can request deletion of your account and associated data by
            emailing support.
          </PrivacyCard>

          <PrivacyCard title="Security">
            Passwords are hashed. Payment data is handled by Stripe (PCI-DSS Level 1). Review
            links are signed and time-limited. We are continuing to harden security in beta;
            please report issues to support.
          </PrivacyCard>

          <PrivacyCard title="Contact">
            For privacy questions, deletion requests, or data inquiries, email
            <b> support@gatepostinbox.com</b>.
          </PrivacyCard>
        </section>

        <p style={{ marginTop: 18, color: "var(--muted2)", fontSize: 13 }}>
          For deletion requests: support@gatepostinbox.com
        </p>
      </div>
    </main>
  );
}

function PrivacyCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="cardTitle">{title}</div>
      <div className="cardBody">{children}</div>
    </div>
  );
}
