import Link from "next/link";

export const dynamic = "force-dynamic";

type ResultState =
  | "accepted"
  | "released"
  | "payouts_not_ready"
  | "no_stripe_account"
  | "already_handled"
  | "invalid_link"
  | "not_found"
  | "transfer_failed"
  | "error";

type Copy = {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  hint?: string;
  showResumeStripe?: boolean;
};

const COPY: Record<ResultState, Copy> = {
  accepted: {
    icon: "✓",
    iconColor: "#34d399",
    title: "Message accepted",
    description:
      "You kept the bond. A payout (minus the platform fee) is on its way to your connected Stripe account.",
  },
  released: {
    icon: "✓",
    iconColor: "#60a5fa",
    title: "Message released",
    description:
      "The bond has been refunded to the sender. The delivery fee was captured as agreed.",
  },
  payouts_not_ready: {
    icon: "!",
    iconColor: "#f59e0b",
    title: "Stripe payouts not ready",
    description:
      "Your Stripe payouts are not ready yet. Finish Stripe onboarding before accepting paid messages.",
    hint: "Once onboarding is complete, return to your inbox and accept the message again.",
    showResumeStripe: true,
  },
  no_stripe_account: {
    icon: "!",
    iconColor: "#f59e0b",
    title: "Connect Stripe first",
    description:
      "You need to connect a Stripe account before you can accept paid messages and receive payouts.",
    hint: "Connect Stripe from your dashboard, then come back to accept this message.",
    showResumeStripe: true,
  },
  already_handled: {
    icon: "i",
    iconColor: "#94a3b8",
    title: "Already handled",
    description:
      "This message has already been accepted, released, or expired. No further action is needed.",
  },
  invalid_link: {
    icon: "!",
    iconColor: "#ef4444",
    title: "Invalid or expired link",
    description:
      "This review link is no longer valid. Open the message from your inbox to take action.",
  },
  not_found: {
    icon: "!",
    iconColor: "#ef4444",
    title: "Message not found",
    description: "We couldn't find that message. It may have been removed.",
  },
  transfer_failed: {
    icon: "!",
    iconColor: "#f59e0b",
    title: "Payout could not be completed",
    description:
      "The payment was captured, but the payout to your account could not be completed. Please try accepting again to retry the payout.",
    hint: "If the issue persists, finish Stripe onboarding and try once more.",
    showResumeStripe: true,
  },
  error: {
    icon: "!",
    iconColor: "#ef4444",
    title: "Something went wrong",
    description:
      "We hit an unexpected error processing your action. Please try again from your inbox.",
  },
};

function normalizeState(raw: string | undefined): ResultState {
  if (!raw) return "error";
  return (raw in COPY ? raw : "error") as ResultState;
}

function sanitizePublicId(raw: string | undefined): string | null {
  if (!raw) return null;
  // Allow only safe URL slug chars to avoid building malformed links.
  return /^[A-Za-z0-9_-]{1,64}$/.test(raw) ? raw : null;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "48px 20px",
  display: "grid",
  placeItems: "start center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 16,
  padding: 28,
  background: "rgba(255,255,255,0.02)",
};

const brandStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 18,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1.25,
};

const descStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 15,
  lineHeight: 1.55,
  opacity: 0.9,
};

const hintStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.5,
  opacity: 0.7,
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 22,
};

const primaryBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.10)",
  color: "inherit",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 14,
};

const secondaryBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: "transparent",
};

export default async function ReviewResultPage(props: {
  searchParams: Promise<{ state?: string; publicId?: string }>;
}) {
  const sp = await props.searchParams;
  const state = normalizeState(sp.state);
  const publicId = sanitizePublicId(sp.publicId);
  const copy = COPY[state];

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={brandStyle}>GatePost Inbox</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: `${copy.iconColor}22`,
              color: copy.iconColor,
              fontWeight: 900,
              fontSize: 20,
              border: `1px solid ${copy.iconColor}66`,
            }}
          >
            {copy.icon}
          </div>
          <h1 style={titleStyle}>{copy.title}</h1>
        </div>

        <p style={descStyle}>{copy.description}</p>
        {copy.hint ? <p style={hintStyle}>{copy.hint}</p> : null}

        <div style={actionsRowStyle}>
          {copy.showResumeStripe ? (
            <Link href="/dashboard" style={primaryBtnStyle}>
              Resume Stripe onboarding
            </Link>
          ) : null}
          <Link
            href="/inbox"
            style={copy.showResumeStripe ? secondaryBtnStyle : primaryBtnStyle}
          >
            Back to inbox
          </Link>
          <Link href="/dashboard" style={secondaryBtnStyle}>
            Back to dashboard
          </Link>
          {publicId ? (
            <Link href={`/messages/${publicId}`} style={secondaryBtnStyle}>
              View message
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
