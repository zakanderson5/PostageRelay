import Link from "next/link";
import TopNav from "./_components/TopNav";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />

      <div className="container" style={{ paddingTop: 18, paddingBottom: 70 }}>
        {/* HERO */}
        <section className="hero">
          <div className="kicker">Inbox • Escrow • Priority</div>
          <h1 className="h1" style={{ fontSize: 54, lineHeight: 1.05 }}>
            Your time is valuable.
            <br />
            Put inbound messages on escrow.
          </h1>

          <p className="lead" style={{ maxWidth: 820 }}>
            GatePost Inbox adds a <b>refundable bond</b> to inbound messages. Serious senders get through.
            You stay in control: <b>accept</b> and get paid, or <b>release</b> to refund.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/start" className="btn btnPrimary">Create your inbox</Link>
            <Link href="#how" className="btn">See how it works</Link>
            <Link href="/inbox/demo" className="btn">View demo</Link>
          </div>

          <div style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
            Payments handled by Stripe • No subscription required • You control accept/release/ignore
          </div>

          {/* SIMPLE VISUAL FLOW */}
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "stretch",
            }}
          >
            {[
              { t: "Sender writes message", s: "They add a refundable bond" },
              { t: "Bond is held", s: "Funds are on hold (escrow-like)" },
              { t: "You review", s: "When you want — not when they demand" },
              { t: "You decide", s: "Accept = paid • Release = refund" },
            ].map((x, i) => (
              <div
                key={i}
                className="card"
                style={{
                  flex: "1 1 220px",
                  minWidth: 220,
                  padding: 14,
                }}
              >
                <div className="cardTitle">{x.t}</div>
                <div className="cardBody" style={{ marginTop: 6 }}>{x.s}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ marginTop: 32 }}>
          <div className="kicker">How it works</div>
          <h2 className="h1" style={{ fontSize: 36 }}>A refundable bond for inbox access</h2>
          <p className="lead" style={{ maxWidth: 900 }}>
            You’re not “selling responses.” You’re creating a fair, refundable deposit-backed lane
            that filters spam and rewards serious outreach.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">1) Set your minimum bond</div>
              <div className="cardBody">
                Choose what it costs to reach you. Examples: $10 for creators, $50 for partnerships,
                $100+ for consulting intake.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">2) Sender submits + bond is held</div>
              <div className="cardBody">
                The sender writes a message and places a bond. Funds are held, not immediately paid out.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">3) You review on your terms</div>
              <div className="cardBody">
                You get a review link and can choose: accept, release (refund), ignore, or let it expire.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">4) Accept = you get paid</div>
              <div className="cardBody">
                When you accept, the bond is captured and split (receiver share vs platform fee),
                based on your configured rules.
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Who it’s for</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Different audiences. Same core idea: prove intent.</h2>
          <p className="lead" style={{ maxWidth: 960 }}>
            GatePost Inbox is useful anywhere you’re flooded with noise, spam, unserious inquiries,
            or people demanding time you didn’t agree to give away.
          </p>

          <div style={{ marginTop: 16, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <UseCaseCard
              title="Busy businesses"
              emoji="🏢"
              pain="Flooded with vague inquiries and time-wasters."
              win="Filter inbound instantly and prioritize serious people."
              bond="$25–$150"
              script="“For priority review, use our GatePost Inbox link (refundable deposit).”"
            />
            <UseCaseCard
              title="High-demand services"
              emoji="🧠"
              pain="Your inbox has become free consulting."
              win="Make inbound fair: deposit-backed access, refundable unless accepted."
              bond="$50–$300"
              script="“Consulting requests go through our deposit-backed inbox.”"
            />
            <UseCaseCard
              title="Creators & influencers"
              emoji="🎥"
              pain="Brand deals + DMs are a firehose; spam is constant."
              win="Create a “paid priority DM” lane that can also be an income stream."
              bond="$10–$200"
              script="“Want to reach me for brand/collab? Use my priority link.”"
            />
            <UseCaseCard
              title="Partnership pitches"
              emoji="🤝"
              pain="Cold outreach is automated and low intent."
              win="A pitch that matters should cost something (refundable bond)."
              bond="$50–$500"
              script="“Partnership inquiries: use GatePost Inbox for priority review.”"
            />
            <UseCaseCard
              title="Priority support lane"
              emoji="⚡"
              pain="Support is backed up; urgent customers need a faster lane."
              win="Offer a refundable priority channel without subscriptions."
              bond="$10–$50"
              script="“Need same-day attention? Use our priority message link.”"
            />
            <UseCaseCard
              title="Recruiting & hiring"
              emoji="🧾"
              pain="Spam applicants, recruiters, irrelevant attachments."
              win="Create a high-intent channel for serious referrals."
              bond="$10–$75"
              script="“For referrals or urgent hiring requests, use priority contact.”"
            />
          </div>
        </section>

        {/* DOMAIN ROUTING */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Domain routing</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Works with your existing email</h2>
          <p className="lead" style={{ maxWidth: 980 }}>
            If you own a domain (like <b>support@yourcompany.com</b>), you can route messages into GatePost Inbox
            without rebuilding your whole workflow.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">Option A: Forward one address (fastest)</div>
              <div className="cardBody">
                Forward <b>support@</b> or <b>sales@</b> into GatePost Inbox. Great for a “priority inbox” channel.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Option B: Route a full domain (advanced)</div>
              <div className="cardBody">
                Route multiple inboxes / aliases. Best for teams. We’ll keep onboarding simple and expand this over time.
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Still keep your free channel</div>
              <div className="cardBody">
                Many businesses will keep a normal contact form and add GatePost Inbox as the “priority lane.”
              </div>
            </div>
          </div>
        </section>

        {/* COPY/PASTE */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">Copy/paste</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Give users language they understand</h2>
          <p className="lead" style={{ maxWidth: 980 }}>
            People should instantly understand this is a <b>refundable deposit</b> for <b>priority review</b> — not a subscription.
            Here are examples you can paste onto your website, bio, or contact page.
          </p>

          <div className="grid" style={{ marginTop: 16 }}>
            <SnippetCard
              title="Business: priority contact"
              text='“Need priority review? Use our Priority Contact link. A refundable deposit helps us filter spam and respond faster.”'
            />
            <SnippetCard
              title="Creator: brand/collab lane"
              text='“Brand/collab inquiries: use my priority link (refundable deposit). If it’s a fit, I’ll accept and respond. If not, you’re refunded.”'
            />
            <SnippetCard
              title="Partnerships: pay-to-pitch"
              text='“We receive high volume outreach. Partnership pitches are reviewed via our deposit-backed inbox for priority review.”'
            />
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 36 }}>
          <div className="kicker">FAQ</div>
          <h2 className="h1" style={{ fontSize: 36 }}>Quick answers</h2>

          <div className="grid" style={{ marginTop: 16 }}>
            <div className="card">
              <div className="cardTitle">Is this a paywall?</div>
              <div className="cardBody">
                Think of it as a refundable deposit-backed priority lane. Many users keep a normal contact method and add GatePost Inbox for “serious only.”
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Do I have to respond to everything?</div>
              <div className="cardBody">
                No. You choose: accept, release, ignore, or expire. The whole point is controlling your time.
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">How do I get paid?</div>
              <div className="cardBody">
                Connect Stripe during onboarding. When you accept a message, your receiver share goes to your connected Stripe account.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/start" className="btn btnPrimary">Get started</Link>
            <Link href="/contact" className="btn">Contact</Link>
            <Link href="/privacy" className="btn">Privacy</Link>
            <Link href="/terms" className="btn">Terms</Link>
          </div>
        </section>

        <footer style={{ marginTop: 38, color: "var(--muted2)", fontSize: 13 }}>
          © {new Date().getFullYear()} GatePost Inbox. Built for people who value attention.
        </footer>
      </div>
    </main>
  );
}

function UseCaseCard(props: {
  title: string;
  emoji: string;
  pain: string;
  win: string;
  bond: string;
  script: string;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22 }}>{props.emoji}</div>
        <div className="cardTitle">{props.title}</div>
      </div>

      <div className="cardBody" style={{ marginTop: 10 }}>
        <div><b>Pain:</b> {props.pain}</div>
        <div style={{ marginTop: 8 }}><b>Win:</b> {props.win}</div>
        <div style={{ marginTop: 8 }}><b>Typical minimum bond:</b> {props.bond}</div>
      </div>

      <div style={{ marginTop: 10, padding: 10, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 6 }}>Example wording</div>
        <div style={{ fontSize: 13 }}>{props.script}</div>
      </div>
    </div>
  );
}

function SnippetCard(props: { title: string; text: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="cardTitle">{props.title}</div>
      <div style={{ marginTop: 10, padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
{props.text}
        </pre>
      </div>
    </div>
  );
}
