import TopNav from "../_components/TopNav";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <TopNav />
      <div style={{ width: "100%", maxWidth: 920, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ fontSize: 34, fontWeight: 900 }}>Privacy</div>
        <p style={{ marginTop: 12, opacity: 0.85, lineHeight: 1.6 }}>
          Placeholder privacy policy. Before going live, replace this with a real policy that clearly explains:
          what data you collect, what you store, how long you retain it, and how users can request deletion.
        </p>
      </div>
    </main>
  );
}
