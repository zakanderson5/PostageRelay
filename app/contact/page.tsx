import TopNav from "../_components/TopNav";

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>Contact</div>
        <p style={{ marginTop: 12, opacity: 0.85, lineHeight: 1.6 }}>
          For now, keep contact dead simple. Replace this address with your preferred support email.
        </p>
        <div style={{ marginTop: 10, border: "1px solid #222", borderRadius: 16, padding: 18 }}>
          support@postagerelay.com
        </div>
      </div>
    </main>
  );
}
