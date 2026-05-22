import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { ORPHAN_TTL_MS } from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCronToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();
  const x = req.headers.get("x-cron-secret");
  if (x) return x.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get("secret");
  if (q) return q.trim();
  return null;
}

async function handle(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    console.error("CRON_SECRET is missing in env");
    return new Response("Server misconfigured (missing CRON_SECRET)", { status: 500 });
  }
  const got = getCronToken(req);
  if (!got || got !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - ORPHAN_TTL_MS);

  const orphans = await prisma.messageAttachment.findMany({
    where: {
      createdAt: { lt: cutoff },
      message: { status: "DRAFT" },
    },
    select: { id: true, blobUrl: true },
    take: 200,
  });

  let deletedBlobs = 0;
  let deletedRows = 0;
  let blobErrors = 0;

  for (const o of orphans) {
    try {
      await del(o.blobUrl);
      deletedBlobs++;
    } catch (e) {
      blobErrors++;
      console.error("orphan blob delete failed", o.id, e);
    }
    try {
      await prisma.messageAttachment.delete({ where: { id: o.id } });
      deletedRows++;
    } catch (e) {
      console.error("orphan row delete failed", o.id, e);
    }
  }

  return Response.json({
    checked: orphans.length,
    deletedBlobs,
    deletedRows,
    blobErrors,
  });
}

export async function POST(req: Request) { return handle(req); }
export async function GET(req: Request) { return handle(req); }
