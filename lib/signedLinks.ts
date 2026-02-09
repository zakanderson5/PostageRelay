import crypto from "crypto";

function getSecret() {
  const s = process.env.ACTION_LINK_SECRET;
  if (!s) throw new Error("Missing ACTION_LINK_SECRET in .env");
  return s;
}

export function signMessage(publicId: string, expUnix: number) {
  const payload = `${publicId}.${expUnix}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function verifyMessageSignature(publicId: string, expUnix: number, sig: string) {
  if (!Number.isFinite(expUnix)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (expUnix < now) return false;

  const expected = signMessage(publicId, expUnix);

  // timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function makeReviewUrl(publicId: string, expUnix: number) {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const sig = signMessage(publicId, expUnix);
  return `${base}/r/${publicId}?e=${expUnix}&s=${sig}`;
}
