"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/settings", label: "Settings" },
];

const wrapStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.25)",
  marginBottom: 24,
};

const innerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "12px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const brandStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "inherit",
  textDecoration: "none",
  fontWeight: 700,
};

const brandMarkStyle: React.CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "linear-gradient(135deg,#6aa9ff,#3ddc84)",
  color: "#0b0b0e",
  fontWeight: 800,
  fontSize: 12,
};

function linkStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    color: active ? "#fff" : "rgba(255,255,255,0.7)",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  };
}

const logoutStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
};

export default function ReceiverNav() {
  const pathname = usePathname() || "";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header style={wrapStyle}>
      <div style={innerStyle}>
        <Link href="/dashboard" style={brandStyle}>
          <span style={brandMarkStyle}>GP</span>
          <span>GatePost</span>
        </Link>

        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} href={l.href} style={linkStyle(active)}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button type="button" onClick={logout} style={logoutStyle}>
          Log out
        </button>
      </div>
    </header>
  );
}
