"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_FILES_PER_MESSAGE,
  MAX_TOTAL_BYTES_PER_MESSAGE,
  buildStorageKey,
  isAllowedContentType,
  sanitizeFilename,
} from "@/lib/attachments";

type Props = {
  slug: string;
  allowBoost: boolean;
  min: string;
  max: string;
};

const ACCEPT_ATTR = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".txt",
  ".docx",
  ...ALLOWED_CONTENT_TYPES,
].join(",");

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SendMessageForm({ slug, allowBoost, min, max }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const picked = Array.from(e.target.files ?? []);
    const merged = [...files, ...picked].slice(0, MAX_FILES_PER_MESSAGE);
    const total = merged.reduce((s, f) => s + f.size, 0);

    for (const f of merged) {
      if (!isAllowedContentType(f.type)) {
        setError(`File type not allowed: ${f.name} (${f.type || "unknown"})`);
        return;
      }
    }
    if (merged.length > MAX_FILES_PER_MESSAGE) {
      setError(`Maximum ${MAX_FILES_PER_MESSAGE} files.`);
      return;
    }
    if (total > MAX_TOTAL_BYTES_PER_MESSAGE) {
      setError("Combined attachment size exceeds 10 MB.");
      return;
    }
    setFiles(merged);
    if (e.target) e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (files.length === 0) return; // let native form POST happen
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);

      // 1) Create the message (JSON path)
      setProgress("Saving message…");
      const createRes = await fetch(`/api/public/pages/${slug}/message`, {
        method: "POST",
        body: fd,
        headers: { accept: "application/json" },
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        throw new Error(text || "Failed to save message");
      }
      const { publicId, checkoutUrl } = (await createRes.json()) as {
        publicId: string;
        checkoutUrl: string;
      };

      // 2) Upload each file directly to Vercel Blob
      const uploaded: {
        url: string;
        pathname: string;
        contentType: string;
        originalFileName: string;
      }[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}: ${f.name}`);
        const key = buildStorageKey(publicId, f.name);
        const result = await upload(key, f, {
          access: "public",
          handleUploadUrl: `/api/messages/${publicId}/attachments/authorize`,
          contentType: f.type,
          clientPayload: JSON.stringify({ contentType: f.type }),
        });
        uploaded.push({
          url: result.url,
          pathname: result.pathname,
          contentType: f.type,
          originalFileName: sanitizeFilename(f.name),
        });
      }

      // 3) Finalize attachment metadata
      setProgress("Finalizing…");
      const finalizeRes = await fetch(
        `/api/messages/${publicId}/attachments/finalize`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: uploaded }),
        },
      );
      if (!finalizeRes.ok) {
        const text = await finalizeRes.text();
        throw new Error(text || "Failed to finalize attachments");
      }

      // 4) Navigate to checkout
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      setSubmitting(false);
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  return (
    <form
      ref={formRef}
      method="post"
      action={`/api/public/pages/${slug}/message`}
      encType="multipart/form-data"
      onSubmit={onSubmit}
      style={{ marginTop: 12, display: "grid", gap: 10 }}
    >
      <input name="senderName" placeholder="Your name (optional)" style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
      <input required name="senderEmail" placeholder="Your email" style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
      <input name="subject" placeholder="Subject (optional)" style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
      <textarea required name="body" placeholder="Message" rows={6} style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />

      {allowBoost ? (
        <input
          name="bondDollars"
          type="number"
          min={Number(min)}
          max={Number(max)}
          step="0.01"
          placeholder={`Bond amount in dollars (min ${min}, max ${max})`}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />
      ) : null}

      <div style={{ marginTop: 4 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          Attachments (optional) — up to {MAX_FILES_PER_MESSAGE} files, 10 MB total
        </label>
        <input
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          onChange={onPickFiles}
          disabled={submitting || files.length >= MAX_FILES_PER_MESSAGE}
          style={{ fontSize: 14 }}
        />
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Allowed: PDF, PNG, JPG, TXT, DOCX. No ZIP or executables.
        </div>
        {files.length > 0 ? (
          <ul style={{ marginTop: 8, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📎 {f.name} <span style={{ color: "#666" }}>({formatSize(f.size)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={submitting}
                  style={{ background: "none", border: "none", color: "#a33", cursor: "pointer", fontWeight: 600 }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {files.length > 0 ? (
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Total: {formatSize(totalBytes)} / 10 MB
          </div>
        ) : null}
      </div>

      {error ? (
        <div style={{ padding: 10, border: "1px solid #f5b7b7", background: "#fff3f3", borderRadius: 8, color: "#a33", fontSize: 13 }}>
          {error}
        </div>
      ) : null}
      {submitting && progress ? (
        <div style={{ padding: 10, border: "1px solid #cfe", background: "#f0fbff", borderRadius: 8, fontSize: 13 }}>
          {progress}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        style={{ padding: 12, borderRadius: 10, border: "1px solid #222", fontWeight: 700, opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? "Sending…" : "Continue"}
      </button>
    </form>
  );
}
