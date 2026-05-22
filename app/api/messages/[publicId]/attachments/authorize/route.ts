import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_SINGLE_FILE_BYTES,
  MAX_FILES_PER_MESSAGE,
  MAX_TOTAL_BYTES_PER_MESSAGE,
  isAllowedContentType,
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
  try { return String(e); } catch { return "unknown"; }
}
function errStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}
function pathnamePrefixOf(pathname: string | undefined): string {
  if (!pathname) return "";
  // Return only the message-scoped prefix for logging; never the random suffix.
  const m = pathname.match(/^(messages\/[^/]+\/)/);
  return m ? m[1] : pathname.split("/").slice(0, 2).join("/") + "/";
}

type ClientPayloadShape = {
  publicId?: string;
  originalFileName?: string;
  contentType?: string;
  sizeBytes?: number;
};

function parseClientPayload(raw: string | null): ClientPayloadShape {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ClientPayloadShape;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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

  if (!hasBlobReadWriteToken) {
    console.warn({
      route: "attachments_authorize",
      publicId,
      hasBlobReadWriteToken,
      error: { name: "ConfigError", message: "BLOB_READ_WRITE_TOKEN is not set" },
    });
    return NextResponse.json(
      { error: "Server is not configured for file uploads (missing BLOB_READ_WRITE_TOKEN)." },
      { status: 500 },
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
      error: { name: errName(err), message: errMessage(err), status: errStatus(err) },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let lastContentType: string | undefined;
  let lastSizeBytes: number | undefined;
  let lastPathnamePrefix: string | undefined;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        lastPathnamePrefix = pathnamePrefixOf(pathname);

        // 1) Pathname must be scoped to this message.
        if (!pathname.startsWith(`messages/${publicId}/`)) {
          throw new Error("Pathname must be scoped to this message");
        }

        // 2) Parse and validate client payload.
        const payload = parseClientPayload(clientPayload);
        if (payload.publicId && payload.publicId !== publicId) {
          throw new Error("publicId mismatch in clientPayload");
        }
        const contentType = (payload.contentType ?? "").toString();
        lastContentType = contentType;
        const sizeBytes = Number(payload.sizeBytes);
        lastSizeBytes = Number.isFinite(sizeBytes) ? sizeBytes : undefined;

        if (!isAllowedContentType(contentType)) {
          throw new Error(`Disallowed contentType: ${contentType || "unknown"}`);
        }
        if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
          throw new Error("Missing or invalid sizeBytes");
        }
        if (sizeBytes > MAX_SINGLE_FILE_BYTES) {
          throw new Error("File exceeds the 10 MB limit");
        }

        // 3) Validate message status + count + total-size against DB.
        const msg = await prisma.message.findUnique({
          where: { publicId },
          select: {
            id: true,
            status: true,
            attachments: { select: { sizeBytes: true } },
            _count: { select: { attachments: true } },
          },
        });
        if (!msg) throw new Error("Message not found");
        if (!isPrePaymentStatus(msg.status)) {
          throw new Error("Message no longer accepts uploads");
        }
        if (msg._count.attachments + 1 > MAX_FILES_PER_MESSAGE) {
          throw new Error("Attachment limit reached");
        }
        const existingTotal = msg.attachments.reduce((s, a) => s + a.sizeBytes, 0);
        if (existingTotal + sizeBytes > MAX_TOTAL_BYTES_PER_MESSAGE) {
          throw new Error("Combined attachment size exceeds 10 MB");
        }

        // 4) Tightly scope the token: a single contentType the PUT will actually send.
        //    This is the key fix — a token whose allowedContentTypes mismatches the
        //    file's x-content-type causes Vercel Blob to reject the PUT with 400/CORS.
        return {
          allowedContentTypes: [contentType],
          maximumSizeInBytes: MAX_SINGLE_FILE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            publicId,
            originalFileName:
              typeof payload.originalFileName === "string"
                ? payload.originalFileName.slice(0, 180)
                : undefined,
            contentType,
            sizeBytes,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Finalization is performed via the finalize route. No-op here so that
        // the server-to-server callback succeeds even if our DB is briefly busy.
      },
    });
    // Return the SDK response shape exactly — do not wrap or rename fields.
    return NextResponse.json(jsonResponse);
  } catch (err: unknown) {
    console.warn({
      route: "attachments_authorize",
      publicId,
      hasBlobReadWriteToken,
      pathnamePrefix: lastPathnamePrefix,
      contentType: lastContentType,
      sizeBytes: lastSizeBytes,
      error: { name: errName(err), message: errMessage(err), status: errStatus(err) },
    });
    const status = errStatus(err) ?? 400;
    return NextResponse.json(
      { error: errMessage(err) || "Upload authorization failed" },
      { status },
    );
  }
}

// NOTE on access mode:
// @vercel/blob >= 2.3 supports private blob storage. The client passes
// access: "private" to upload(); the server token returned by handleUpload
// is matched to that access mode automatically. Receiver downloads go
// through the auth-gated /api/messages/[publicId]/attachments/[id] route,
// which uses the server SDK's get() with { access: "private" } to stream
// the blob. The raw blob URL is never returned to the client.
