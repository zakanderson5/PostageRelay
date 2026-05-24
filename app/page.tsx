import Link from "next/link";
import TopNav from "./_components/TopNav";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />

      <div className="container" style={{ paddingTop: 18, paddingBottom: 70 }}>
        {/* HERO */}
        <section className="hero">
          <div className="kicker">Refundable deposit · You decide · Stripe-powered</div>
          <h1 className="h1">
            Your time has a price.
            <br />
            Your inbox should know it.
          </h1>

          <p className="lead" style={{ maxWidth: 820 }}>
            GatePost adds a <b>refundable deposit</b> to inbound requests. Worth your time?
            Accept and get paid. Wasn&apos;t? Refund in one click.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/start" className="btn btnPrimary">Start charging for inbox access</Link>
            <Link href="#how" className="btn">See how it works</Link>
          </div>

          <div style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
            Card details handled by Stripe • No subscription • You stay in control
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Who it&apos;s for</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Built for people whose inbox is a job</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            Consultants, coaches, fractional operators, and independent experts spend hours every week
            triaging &ldquo;quick questions,&rdquo; cold outreach, and free-consulting requests. GatePost makes inbound
            self-select: serious people pay a refundable deposit; time-wasters move on.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <PersonaCard
              title="Independent consultants"
              pain="Your inbox is full of &ldquo;pick your brain&rdquo; asks that turn into 45-minute calls."
              win="A refundable deposit filters tire-kickers. Serious leads still get through."
              bond="$75–$300"
            />
            <PersonaCard
              title="Coaches & experts"
              pain="Free advice requests crowd out paying clients."
              win="Charge a small refundable deposit for inbound questions. Accept the real ones."
              bond="$50–$200"
            />
            <PersonaCard
              title="Fractional operators"
              pain="Recruiter spam and off-fit intros eat your week."
              win="Open a paid lane for serious intros. Refund the noise in one click."
              bond="$100–$500"
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ marginTop: 36 }}>
          <div className="kicker">How it works</div>
          <h2 className="h1" style={{ fontSize: 36 }}>A refundable deposit for inbox access</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            You set a minimum deposit. Senders authorize a hold on their card &mdash; not an
            immediate charge. You review on your schedule, and decide.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <StepCard
              n="1"
              title="Create your GatePost link"
              body="Pick a slug, connect Stripe for payouts, and set your minimum deposit."
            />
            <StepCard
              n="2"
              title="Sender authorizes a deposit"
              body="They write a message and place a refundable hold. Card is authorized, not charged."
            />
            <StepCard
              n="3"
              title="You review on your terms"
              body="You get a private review link. Read it when you want — not when they demand."
            />
            <StepCard
              n="4"
              title="Accept, release, or let it expire"
              body="Accept = bond is captured and paid out. Release / ignore / expire = sender is refunded."
            />
          </div>
        </section>

        {/* WHY SENDERS PAY */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Why senders pay</div>
          <h2 className="h1" style={{ fontSize: 36 }}>A refundable deposit is a credibility signal</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            Serious senders don&apos;t mind a refundable hold &mdash; it&apos;s exactly how they prove they&apos;re
            not wasting your time. They get attention they wouldn&apos;t get otherwise, and the deposit
            comes back unless you accept the message.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">It&apos;s refundable</div>
              <div className="cardBody">
                A deposit, not a charge. Released if you don&apos;t accept &mdash; or if you don&apos;t respond at all.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">It buys priority, not a guaranteed reply</div>
              <div className="cardBody">
                You retain full discretion. Acceptance is yours alone &mdash; never automatic.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">It filters the noise both ways</div>
              <div className="cardBody">
                The people willing to back their request with a refundable hold are the people you actually want to hear from.
              </div>
            </div>
          </div>
        </section>

        {/* WORKED EXAMPLE */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Worked example</div>
          <h2 className="h1" style={{ fontSize: 36 }}>What a $100 deposit actually looks like</h2>

          <div
            className="card"
            style={{ marginTop: 16, padding: 18, lineHeight: 1.7 }}
          >
            <div>
              <b>Sender authorizes:</b> $100.99 hold on their card ($100 refundable deposit + $0.99 non-refundable delivery fee).
            </div>
            <div style={{ marginTop: 10 }}>
              <b>If you accept:</b> Bond is captured. You receive $80 (80% of bond) to your connected Stripe account. GatePost keeps $20 (20% platform share) plus the $0.99 delivery fee.
            </div>
            <div style={{ marginTop: 10 }}>
              <b>If you release, ignore, or the timeout expires:</b> The $100 deposit is released back to the sender on the standard card/bank timeline. Only the $0.99 delivery fee is captured.
            </div>
            <div style={{ marginTop: 12, color: "var(--muted2)", fontSize: 13 }}>
              See <Link href="/pricing" style={{ color: "#a9c4ff" }}>Pricing</Link> for the $25, $100, and $500 examples.
            </div>
          </div>
        </section>

        {/* STRIPE TRUST */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Payments &amp; trust</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Stripe handles the money</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            GatePost never sees or stores card details. Stripe authorizes the hold, holds the funds,
            and pays your share to your connected Stripe account when you accept.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">Authorization, not a charge</div>
              <div className="cardBody">
                Stripe places a hold on the sender&apos;s card. No money moves until you accept the message.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Payouts via Stripe Connect</div>
              <div className="cardBody">
                Connect a Stripe account during onboarding. Accepted-bond payouts arrive on Stripe&apos;s standard schedule.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Card details never touch us</div>
              <div className="cardBody">
                Stripe is PCI-DSS Level 1. GatePost only stores message and payment metadata.
              </div>
            </div>
          </div>
        </section>

        {/* PRIORITY LANE */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Keep your normal inbox</div>
          <h2 className="h1" style={{ fontSize: 36 }}>GatePost is a priority lane, not a replacement</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            Keep your regular contact form, email, and DMs. Add GatePost as the &ldquo;serious only&rdquo;
            channel for inbound that needs to skip the queue.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">In your email signature</div>
              <div className="cardBody">
                &ldquo;Need a faster reply? Use my priority link (refundable deposit).&rdquo;
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">On your bio / website</div>
              <div className="cardBody">
                &ldquo;For consulting requests, use my GatePost link &mdash; refundable unless I accept.&rdquo;
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">For partnerships and intros</div>
              <div className="cardBody">
                &ldquo;Partnership pitches reviewed via my deposit-backed inbox for priority review.&rdquo;
              </div>
            </div>
          </div>
        </section>

        {/* FAQ PREVIEW */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">FAQ</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Quick answers</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">Is this a paywall?</div>
              <div className="cardBody">
                No. It&apos;s a refundable deposit for priority review. Most users keep a normal contact channel and add GatePost as their serious-only lane.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Is the deposit really refundable?</div>
              <div className="cardBody">
                Yes. If you release the message, ignore it, or the timeout expires, the deposit is released back on Stripe&apos;s standard timeline. Only the $0.99 delivery fee is non-refundable once delivered.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Do I have to respond?</div>
              <div className="cardBody">
                No. Acceptance is fully your call. Doing nothing simply releases the deposit when the timeout expires.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/faq" className="btn">Read full FAQ</Link>
            <Link href="/start" className="btn btnPrimary">Start charging for inbox access</Link>
            <Link href="/pricing" className="btn">Pricing</Link>
          </div>
        </section>

        <footer style={{ marginTop: 38, color: "var(--muted2)", fontSize: 13, display: "flex", flexWrap: "wrap", gap: 14 }}>
          <span>© {new Date().getFullYear()} GatePost Inbox.</span>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      </div>
    </main>
  );
}

function PersonaCard(props: { title: string; pain: string; win: string; bond: string }) {
  return (
    <div className="card">
      <div className="cardTitle">{props.title}</div>
      <div className="cardBody">
        <div><b>Pain:</b> <span dangerouslySetInnerHTML={{ __html: props.pain }} /></div>
        <div style={{ marginTop: 8 }}><b>Win:</b> {props.win}</div>
        <div style={{ marginTop: 8 }}><b>Typical minimum deposit:</b> {props.bond}</div>
      </div>
    </div>
  );
}

function StepCard(props: { n: string; title: string; body: string }) {
  return (
    <div className="card">
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
          {props.n}
        </div>
        <div className="cardTitle">{props.title}</div>
      </div>
      <div className="cardBody">{props.body}</div>
    </div>
  );
}
