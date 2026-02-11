export default function StartPage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Create your Postage Relay link</h1>

      <p style={{ marginTop: 10, color: "#444" }}>
        Invite-only for now. You’ll get a personal link you can share (example:
        <b> https://www.postagerelay.com/u/yourname</b>).
      </p>

      <form
        action="/api/start"
        method="post"
        style={{ marginTop: 16, display: "grid", gap: 10, padding: 14, border: "1px solid #ddd", borderRadius: 12 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Invite code</span>
          <input name="invite" required placeholder="Invite code" style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Your email</span>
          <input name="email" type="email" required placeholder="you@example.com" style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Your link (slug)</span>
          <input name="slug" required placeholder="e.g. zak (letters/numbers/hyphens)" style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Display name (optional)</span>
          <input name="displayName" placeholder="e.g. Zak" style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </label>

        <button type="submit" style={{ padding: 12, borderRadius: 12, border: "1px solid #222", fontWeight: 800 }}>
          Create my link
        </button>
      </form>

      <p style={{ marginTop: 14, color: "#666" }}>
        Note: if you already have a link, submitting again will redirect you to your existing page.
      </p>
    </main>
  );
}
