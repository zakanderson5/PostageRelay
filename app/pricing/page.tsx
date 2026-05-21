import TopNav from "../_components/TopNav";

export default function PricingPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>Pricing</div>

        <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6, maxWidth: 760 }}>
          For now, keep this page simple and honest. We can refine the exact economics once you finalize the product rules.
          The important part is: a sender posts a refundable bond; you control whether it’s accepted (paid) or released/expired (refunded).
        </p>

        <div style={{ marginTop: 14, border: "1px solid #222", borderRadius: 16, padding: 18, lineHeight: 1.6 }}>
          Suggested default:
          <br />
          - You set a minimum bond.
          <br />
          - If you accept: bond is captured and split between you and GatePost Inbox (platform fee).
          <br />
          - If you release/ignore: sender is refunded (optionally minus a small handling fee you define).
        </div>

        <p style={{ marginTop: 12, opacity: 0.75 }}>
          Next: once you confirm exact percentages/fees, we’ll update this page to be explicit and customer-friendly.
        </p>
      </div>
    </main>
  );
}
