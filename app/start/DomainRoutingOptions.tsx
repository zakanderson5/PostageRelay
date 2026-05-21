"use client";

import { useMemo, useState } from "react";

type Props = {
  slug: string;
};

function normalizeSlug(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function DomainRoutingOptions({ slug }: Props) {
  const [copied, setCopied] = useState<"" | "relay" | "link">("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const safeSlug = useMemo(() => normalizeSlug(slug) || "your-slug", [slug]);

  // You can change this later if you decide a different inbound domain.
  const inboundDomain = "in.gatepostinbox.com";

  const relayAddress = `${safeSlug}@${inboundDomain}`;
  const publicLink = `https://www.gatepostinbox.com/u/${safeSlug}`;

  return (
    <section style={{ marginTop: 18, padding: 14, border: "1px solid #333", borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Domain routing (optional)</div>
      <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.4 }}>
        Recommended: start with your GatePost Inbox link. If you own a domain, you can also forward one address
        (like hello@company.com) into GatePost Inbox.
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #2a2a2a", borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Option A (default): Publish your link</div>
        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#ddd" }}>
          {publicLink}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button"
            onClick={async () => {
              const ok = await copyToClipboard(publicLink);
              setCopied(ok ? "link" : "");
              setTimeout(() => setCopied(""), 1200);
            }}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#fff", cursor: "pointer" }}
          >
            Copy link
          </button>
          {copied === "link" ? <span style={{ fontSize: 12, color: "#9f9" }}>Copied</span> : null}
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #2a2a2a", borderRadius: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Option B (business-friendly): Forward an address</div>
        <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.4 }}>
          Create (or use) an address like <b>hello@yourdomain.com</b> and set a forwarding rule to:
        </div>
        <div style={{ marginTop: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "#ddd" }}>
          {relayAddress}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button"
            onClick={async () => {
              const ok = await copyToClipboard(relayAddress);
              setCopied(ok ? "relay" : "");
              setTimeout(() => setCopied(""), 1200);
            }}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#fff", cursor: "pointer" }}
          >
            Copy forwarding address
          </button>
          {copied === "relay" ? <span style={{ fontSize: 12, color: "#9f9" }}>Copied</span> : null}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
          Tip: Start by forwarding just one “public” address (e.g. hello@, sales@, support@) instead of your whole domain.
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "#fff", cursor: "pointer" }}
        >
          {showAdvanced ? "Hide advanced options" : "Show advanced options"}
        </button>

        {showAdvanced ? (
          <div style={{ marginTop: 10, padding: 12, border: "1px solid #2a2a2a", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Option C (advanced): Route the whole domain (MX)</div>
            <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.4 }}>
              This requires DNS/MX changes and domain verification. It’s powerful, but we should ship it after
              forwarding is solid.
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
              Status: not enabled in-product yet (we’ll add it once inbound email ingestion is wired up).
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
