import TopNav from "../_components/TopNav";

export default function FaqPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>FAQ</div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 900 }}>Do I need Stripe?</div>
            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.6 }}>
              Yes. If you want to receive payouts when you accept a message, you connect a Stripe account during onboarding.
            </div>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 900 }}>What if I don’t want to accept a message?</div>
            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.6 }}>
              You can release it (refund), or do nothing and let it expire (refund behavior depends on your rules).
            </div>
          </div>

          <div style={{ border: "1px solid #222", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 900 }}>Can I route a business email address through PostageRelay?</div>
            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.6 }}>
              Yes. You can forward a public inbox like support@yourdomain.com into PostageRelay using a forwarding rule.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
