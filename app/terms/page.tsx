import TopNav from "../_components/TopNav";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div className="container" style={{ paddingTop: 18, paddingBottom: 60 }}>
        <section className="hero">
          <div className="kicker">Beta terms</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Terms of service (beta)</h1>
          <p className="lead">
            Plain-English beta terms for GatePost Inbox. These describe how the service works
            and what you agree to while using the private beta. They are written for clarity,
            not legal completeness.
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
            <b>Beta notice:</b> These beta terms are not a substitute for legal review.
            Full public-launch terms should be reviewed by counsel.
          </div>
        </section>

        <section style={{ marginTop: 22, display: "grid", gap: 12 }}>
          <TermsCard title="Refundable deposit">
            Senders authorize a refundable deposit (a card hold) to send a message. The deposit
            is captured only if the receiver accepts the message. If the receiver releases the
            message, ignores it, or the timeout expires, the deposit is released back to the
            sender on the card / bank&apos;s standard timeline.
          </TermsCard>

          <TermsCard title="Delivery fee">
            A $0.99 non-refundable delivery fee is captured once the message is delivered for
            the receiver to review. It applies regardless of whether the receiver accepts,
            releases, or ignores the message.
          </TermsCard>

          <TermsCard title="No guarantee of response">
            GatePost does not guarantee that any receiver will read, reply to, or accept any
            message. Authorizing a deposit purchases delivery and the opportunity for priority
            review &mdash; not a guaranteed response.
          </TermsCard>

          <TermsCard title="Receiver discretion">
            Receivers have full discretion to accept, release, or ignore any message. The
            decision is entirely the receiver&apos;s. Acceptance is not automatic and is not
            guaranteed by any conduct of GatePost.
          </TermsCard>

          <TermsCard title="Stripe as payment processor">
            All payments are processed by Stripe. Card details are handled by Stripe and are
            not stored by GatePost. Receivers must connect a Stripe account (Stripe Connect)
            to receive payouts. Use of the payment functionality is subject to Stripe&apos;s
            terms as well.
          </TermsCard>

          <TermsCard title="Not a bank, escrow agent, or fiduciary">
            GatePost is not a bank, escrow agent, fiduciary, or money transmitter. We do not
            hold customer funds. Funds are authorized, captured, paid out, and refunded by
            Stripe. References to &ldquo;hold,&rdquo; &ldquo;capture,&rdquo; and &ldquo;refund&rdquo; describe Stripe
            payment behavior, not an escrow arrangement in any legal sense.
          </TermsCard>

          <TermsCard title="Attachments and prohibited content">
            Senders may attach files of permitted types (PDF, PNG, JPG, TXT, DOCX) within size
            limits. You agree not to send: unlawful, harassing, defamatory, fraudulent, or
            infringing content; malware or executables; CSAM or other illegal sexual content;
            offers of securities or regulated financial products outside permitted contexts;
            spam or bulk unsolicited outreach. We may suspend accounts and remove content for
            violations.
          </TermsCard>

          <TermsCard title="Disputes and chargebacks">
            Card disputes are handled through the card issuer&apos;s standard dispute process. We
            recommend contacting support first &mdash; most issues are resolvable. Repeated
            disputes may lead to account suspension and may affect a receiver&apos;s ability to
            receive payouts via Stripe.
          </TermsCard>

          <TermsCard title="Support contact">
            Email <b>support@gatepostinbox.com</b> for support, refund requests, abuse reports,
            or beta feedback. We aim to respond within a few business days during the private
            beta.
          </TermsCard>

          <TermsCard title="Service availability">
            The service is provided &ldquo;as is&rdquo; during the beta. Features may change, and the
            service may be unavailable from time to time. We may modify or discontinue
            features without notice during the beta period.
          </TermsCard>

          <TermsCard title="Changes to these terms">
            These beta terms may be updated as the product evolves and as we prepare full
            public-launch terms reviewed by counsel. Continued use of the service constitutes
            acceptance of the current version.
          </TermsCard>
        </section>

        <p style={{ marginTop: 18, color: "var(--muted2)", fontSize: 13 }}>
          Questions: support@gatepostinbox.com
        </p>
      </div>
    </main>
  );
}

function TermsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="cardTitle">{title}</div>
      <div className="cardBody">{children}</div>
    </div>
  );
}
