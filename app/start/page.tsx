export default function StartPage() {
  return (
    <main
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 20,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Create your PostageRelay inbox</h1>

      <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.4 }}>
        You’ll pick your link first, then you’ll be redirected to Stripe to connect an account so you
        can receive payouts when you accept messages.
      </p>

      <form action="/api/start" method="POST" style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Your email (where you’ll receive reviews)</span>
          <input
            name="email"
            type="email"
            placeholder="you@company.com"
            required
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Choose your link</span>
          <input
            name="slug"
            placeholder="acme-support"
            required
            minLength={3}
            maxLength={32}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Display name (optional)</span>
          <input
            name="displayName"
            placeholder="Acme Support"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #333" }}
          />
        </label>

        {/* Honeypot: bots tend to fill this. Humans won't see it. */}
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
        />

        <button
          type="submit"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #333",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Continue to Stripe
        </button>
      </form>

      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
        By continuing you’ll be redirected to Stripe Connect onboarding.
      </p>
    </main>
  );
}
