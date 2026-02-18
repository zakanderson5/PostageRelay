import Link from "next/link";

export default function TopNav() {
  return (
HEAD
    <div
      style={{
        width: "100%",
        maxWidth: 920,
        margin: "0 auto",
        padding: "18px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 800 }}>
        PostageRelay
      </Link>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Link href="/how-it-works" style={{ textDecoration: "none", color: "inherit", opacity: 0.9 }}>
          How it works
        </Link>
        <Link href="/pricing" style={{ textDecoration: "none", color: "inherit", opacity: 0.9 }}>
          Pricing
        </Link>
        <Link href="/faq" style={{ textDecoration: "none", color: "inherit", opacity: 0.9 }}>
          FAQ
        </Link>

        <span style={{ opacity: 0.35 }}>|</span>

        <Link
          href="/login"
          style={{
            textDecoration: "none",
            color: "inherit",
            opacity: 0.95,
          }}
        >
          Log in
        </Link>

        <Link
          href="/start"
          style={{
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #333",
            padding: "8px 12px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          Sign up
        </Link>
      </div>
    </div>

    <header className="nav">
      <div className="container navInner">
        <Link href="/" className="brand">
          <span className="brandMark">PR</span>
          <span>PostageRelay</span>
          <span className="badge">BETA</span>
        </Link>

        <nav className="navLinks">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
        </nav>

        <div className="navCtas">
          <Link href="/login" className="btn">Log in</Link>
          <Link href="/start" className="btn btnPrimary">Sign up</Link>
        </div>
      </div>
    </header>
marketing-homepage
  );
}
