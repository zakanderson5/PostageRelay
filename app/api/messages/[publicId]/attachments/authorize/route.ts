import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_SINGLE_FILE_BYTES,
  MAX_FILES_PER_MESSAGE,
  isPrePaymentStatus,
} from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function errName(e: unknown): string {
  if (e instanceof Error) return e.name;
  return typeof e;
}
function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "unknown";
  }
}
function errStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const hasBlobReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (!PUBLIC_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Preflight: a missing blob token is the #1 cause of client uploads
  // appearing to "freeze". Fail loudly and clearly instead.
  if (!hasBlobReadWriteToken) {
    console.warn({
      route: "attachments_authorize",
      publicId,
      hasBlobReadWriteToken,
      error: {
        name: "ConfigError",
        message: "BLOB_READ_WRITE_TOKEN is not set on the server",
      },
    });
    return NextResponse.json(
      {
        error:
          "Server is not configured for file uploads (missing BLOB_READ_WRITE_TOKEN).",
      },
      { status: 500 },
    );
  }

  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: { id: true, status: true, _count: { select: { attachments: true } } },
  });
  if (!msg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isPrePaymentStatus(msg.status)) {
    return NextResponse.json(
      { error: "Message no longer accepts uploads" },
      { status: 409 },
    );
  }
  if (msg._count.attachments >= MAX_FILES_PER_MESSAGE) {
    return NextResponse.json(
      { error: "Attachment limit reached" },
      { status: 409 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch (err: unknown) {
    console.warn({
      route: "attachments_authorize",
      publicId,
      hasBlobReadWriteToken,
      error: {
        name: errName(err),
        message: errMessage(err),
        status: errStatus(err),
      },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let lastContentType: string | undefined;
  let lastSizeBytes: number | undefined;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(`messages/${publicId}/`)) {
          throw new Error("Pathname must be scoped to this message");
        }
        let declaredType: string | undefined;
        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload) as {
              contentType?: string;
              sizeBytes?: number;
            };
            declaredType = parsed.contentType;
            if (typeof parsed.sizeBytes === "number") {
              lastSizeBytes = parsed.sizeBytes;
            }
          } catch {
            // ignore malformed payload
          }
        }
        lastContentType = declaredType;
        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_SINGLE_FILE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ publicId, declaredType }),
        };
      },
      onUploadCompleted: async () => {
        // Finalization happens via the finalize route. No-op here.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err: unknown) {
    console.warn({
      route: "attachments_authorize",
      publicId,
      hasBlobReadWriteToken,
      contentType: lastContentType,
      sizeBytes: lastSizeBytes,
      error: {
        name: errName(err),
        message: errMessage(err),
        status: errStatus(err),
      },
    });
    const status = errStatus(err) ?? 400;
    return NextResponse.json(
      { error: errMessage(err) || "Upload authorization failed" },
      { status },
    );
  }
}
