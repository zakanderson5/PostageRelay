import Link from "next/link";

export default function TopNav() {
  return (
    <header className="nav">
      <div className="container navInner">
        <Link href="/" className="brand">
          <span className="brandMark">PR</span>
          <span>GatePost</span>
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
  );
}
